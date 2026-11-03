import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { gsap } from "gsap";
import { markBooted } from "../../lib/boot";
import { profile } from "../../data/profile";
import { useBootAssets } from "../../lib/load-progress";
import { useMediaQuery } from "../../lib/use-media-query";
import { ConcentricRings } from "./ConcentricRings";
import { HudCorners } from "./HudCorners";
import loadingBg from "../../assets/loading/loadingscreenbackground.webp";

const MASK_SRC = `${import.meta.env.BASE_URL}images/ui/persona-mask.png`;
const BOOT_SOURCES: readonly string[] = [MASK_SRC, loadingBg];
/** Sin splash que mostrar no hace falta precargar sus imagenes. */
const NO_SOURCES: readonly string[] = [];

/** Mismo fondo (rampa + skyline) que el resto de la pantalla de carga. */
const LOADING_BG = `linear-gradient(to bottom, rgba(10,10,10,0.8), rgba(10,10,10,0.6) 40%, rgba(10,10,10,0.88)), url(${loadingBg})`;

const QUESTION = "¿Viaje antes que destino?";

/** Pendiente del corte diagonal, en % del ancho del viewport. */
const SLOPE = 20;
/** Techo del contador mientras queden recursos pendientes. */
const HOLD_AT = 92;
/** Duracion minima de la coreografia antes de permitir el 100%. */
const MIN_INTRO = 2.5;
/** Red de seguridad: nunca dejar el splash bloqueando la portada. */
const SAFETY_MS = 9000;

/** La mascara es 400x233, asi que la inclinacion del trazo es fija. */
const CLIP_ZERO =
  "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" as const;

const STATUS_STEPS: ReadonlyArray<readonly [number, string]> = [
  [24, "DESPERTANDO"],
  [52, "RECOPILANDO DATOS"],
  [78, "SINCRONIZANDO"],
  [98, "AJUSTANDO MASCARA"],
  [100, "LISTO"],
];

const DIAMONDS = [
  { left: "0%", top: "0%", dx: -28, dy: -28 },
  { left: "100%", top: "0%", dx: 28, dy: -28 },
  { left: "0%", top: "100%", dx: -28, dy: 28 },
  { left: "100%", top: "100%", dx: 28, dy: 28 },
];

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

/** Angulo que hace que una barra vertical siga el corte diagonal. */
const cutAngle = (width: number, height: number) =>
  (-Math.atan(((SLOPE / 100) * width) / height) * 180) / Math.PI;

let loadScreenShown = false;

/**
 * Pantalla de carga — "el antifaz se dibuja".
 *
 * Una sola timeline GSAP orquesta cuatro actos:
 *  1. Trazo: la silueta del antifaz entra como tinta roja, con una pluma
 *     luminosa que barre en diagonal.
 *  2. Relleno: la imagen real llega 13 unidades por detras del trazo,
 *     con una trama de semitono que se disuelve.
 *  3. Glitch + impacto: cuatro frames de desplazamiento/skew, copias
 *     cian y papel, y el "punch" con diamantes.
 *  4. Salida: cuchilla roja diagonal que corta la pantalla y revela el
 *     menu principal.
 *
 * El contador avanza con el suelo cinematografico pero nunca por encima
 * de la carga REAL (fuentes, window.load e imagenes del splash). Se
 * puede saltar con click o cualquier tecla; con `prefers-reduced-motion`
 * el splash no llega a montarse y el menú aparece de inmediato.
 *
 * Todas las escrituras por fotograma van directas al DOM (sin estado de
 * React) y solo tocan transform / opacity / clip-path.
 */
export function LoadScreen() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const assets = useBootAssets(reduced ? NO_SOURCES : BOOT_SOURCES);

  const [hidden, setHidden] = useState(loadScreenShown || reduced);
  const [impact, setImpact] = useState(false);
  const [maskReady, setMaskReady] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const halftoneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ghostCyanRef = useRef<HTMLDivElement>(null);
  const ghostPaperRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const bladeRef = useRef<HTMLDivElement>(null);
  const diamondsRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const ratioRef = useRef(0);
  const readyRef = useRef(false);
  const repaintRef = useRef<(() => void) | null>(null);
  const finishRef = useRef<(() => void) | null>(null);
  const forceRef = useRef<(() => void) | null>(null);
  const exitingRef = useRef(false);

  const hide = useCallback(() => {
    loadScreenShown = true;
    markBooted();
    setHidden(true);
  }, []);

  const skip = useCallback(() => {
    if (hidden || exitingRef.current) return;
    if (reduced || !forceRef.current) {
      hide();
      return;
    }
    forceRef.current();
  }, [hidden, reduced, hide]);

  /* Sin movimiento no hay splash: se marca el arranque y se revela el menú
     de inmediato. Así nadie con `prefers-reduced-motion` ve un fotograma
     a medio pintar ni el corte diagonal. */
  useEffect(() => {
    if (reduced) hide();
  }, [reduced, hide]);

  /* La imagen del antifaz debe estar decodificada antes de dibujarla:
     si la red va lenta, no queremos barrer un hueco vacio. */
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      setMaskReady(true);
      return;
    }
    const done = () => setMaskReady(true);
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    return () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
    };
  }, []);

  /* Skip con cualquier tecla. En captura sobre `window` para que los
     atajos 1-4 del menu no naveguen mientras el splash sigue arriba. */
  useEffect(() => {
    if (hidden) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Tab" || /^F\d+$/.test(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      skip();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [hidden, skip]);

  /* La carga real entra por aquí: repinta y, si ya toca, dispara la salida. */
  useEffect(() => {
    ratioRef.current = assets.ratio;
    repaintRef.current?.();

    readyRef.current = assets.ready;

    if (!assets.ready) return;
    if (reduced) {
      hide();
      return;
    }
    finishRef.current?.();
  }, [assets.ratio, assets.ready, reduced, hide]);

  /* ------------------------------------------------------------------
     Timeline principal (solo con movimiento permitido)
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (hidden || reduced || !maskReady) return;

    const root = rootRef.current;
    const ink = inkRef.current;
    const fill = fillRef.current;
    const pen = penRef.current;
    const stage = stageRef.current;
    if (!root || !ink || !fill || !pen || !stage) return;

    const halftone = halftoneRef.current;
    const glow = glowRef.current;
    const ghostCyan = ghostCyanRef.current;
    const ghostPaper = ghostPaperRef.current;
    const flash = flashRef.current;
    const panel = panelRef.current;
    const bar = barRef.current;
    const pct = pctRef.current;
    const count = countRef.current;
    const status = statusRef.current;
    const blade = bladeRef.current;
    const top = topRef.current;
    const hud = hudRef.current;

    const bars = barsRef.current
      ? (Array.from(barsRef.current.children) as HTMLElement[])
      : [];
    const diamonds = diamondsRef.current
      ? (Array.from(diamondsRef.current.children) as HTMLElement[])
      : [];

    let finished = false;
    let exitTl: gsap.core.Timeline | null = null;
    let bladeAngle = cutAngle(window.innerWidth, window.innerHeight);

    /** Estado que GSAP interpola; nunca provoca renders de React. */
    const state = { wipe: 0, shown: 0, cut: -6 };
    const clock = { v: 0 };

    const writeCounter = (value: number) => {
      const rounded = value >= 99.5 ? 100 : Math.round(value);
      if (pct) pct.textContent = String(rounded).padStart(2, "0");
      if (bar) gsap.set(bar, { scaleX: Math.max(0.001, value / 100) });
      if (status) {
        const label =
          STATUS_STEPS.find(([limit]) => rounded <= limit)?.[1] ?? "LISTO";
        if (status.textContent !== label) status.textContent = label;
      }
    };

    /* Contador = avance del suelo cinematografico, pero nunca por encima
       de la carga real: si la red va lenta, manda la red. */
    const paint = () => {
      const real = ratioRef.current * HOLD_AT;
      state.shown = Math.min(HOLD_AT, clock.v, real);
      writeCounter(state.shown);
    };

    /* Trazo y relleno: dos frentes diagonales, el relleno 13 uds. detras. */
    const paintWipe = () => {
      const w = state.wipe;
      const inkEdge = clamp(w);
      const fillEdge = clamp(w - 13);

      ink.style.clipPath = `polygon(0% 0%, ${inkEdge}% 0%, ${inkEdge - SLOPE}% 100%, 0% 100%)`;
      fill.style.clipPath = `polygon(0% 0%, ${fillEdge}% 0%, ${fillEdge - SLOPE}% 100%, 0% 100%)`;

      if (pen) {
        pen.style.transform = `translate3d(${w}%, 0, 0)`;
        pen.style.opacity = w > 2 && w < 124 ? "1" : "0";
      }
      if (halftone) {
        halftone.style.opacity = String(
          Math.max(0, 1 - Math.max(0, w - 14) / 96) * 0.55,
        );
      }
    };

    /** Corte de salida: el splash se retira de izquierda a derecha. */
    const paintCut = () => {
      const topEdge = clamp(state.cut);
      const bottomEdge = clamp(state.cut - SLOPE);
      root.style.clipPath = `polygon(${topEdge}% 0%, 100% 0%, 100% 100%, ${bottomEdge}% 100%)`;

      if (blade) {
        const x = (state.cut / 100) * window.innerWidth - window.innerWidth * 0.34;
        blade.style.transform = `translate3d(${x}px, 0, 0) skewX(${bladeAngle}deg)`;
      }
    };

    const onResize = () => {
      bladeAngle = cutAngle(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    repaintRef.current = paint;

    let safety = 0;

    const ctx = gsap.context(() => {
      /* -------- Acto 0: fondo, HUD y panel -------- */
      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      intro.fromTo(
        bgRef.current,
        { autoAlpha: 0.25, scale: 1.06 },
        { autoAlpha: 1, scale: 1, duration: 2.6, ease: "power2.out" },
        0,
      );

      intro.fromTo(
        top,
        { autoAlpha: 0, y: -10 },
        { autoAlpha: 1, y: 0, duration: 0.55 },
        0.1,
      );

      intro.fromTo(
        hud,
        { autoAlpha: 0, scale: 0.94 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)" },
        0.18,
      );

      intro.fromTo(
        glow,
        { autoAlpha: 0, scale: 0.86 },
        { autoAlpha: 0.85, scale: 1, duration: 0.7 },
        0.2,
      );

      /* -------- Acto 1: el trazo -------- */
      intro.to(
        state,
        {
          wipe: 126,
          duration: 1.05,
          ease: "power2.inOut",
          onUpdate: paintWipe,
        },
        0.26,
      );

      /* -------- Acto 2: glitch breve -------- */
      const glitch = gsap.timeline();
      const frames = [
        { x: -7, skew: 1.4, cyan: 0.85, paper: 0.45, dx: -7 },
        { x: 6, skew: -1.6, cyan: 0.35, paper: 0.8, dx: 9 },
        { x: -4, skew: 0.9, cyan: 0.7, paper: 0.3, dx: -4 },
        { x: 3, skew: -0.6, cyan: 0.2, paper: 0.5, dx: 5 },
      ];
      frames.forEach((frame, index) => {
        const at = index * 0.05;
        glitch.set(stage, { x: frame.x, skewX: frame.skew }, at);
        glitch.set(
          ghostCyan,
          { autoAlpha: frame.cyan, x: frame.dx },
          at,
        );
        glitch.set(
          ghostPaper,
          { autoAlpha: frame.paper, x: -frame.dx },
          at,
        );
        if (bars.length) {
          glitch.set(
            bars,
            {
              autoAlpha: index % 2 === 0 ? 0.85 : 0.4,
              y: () => Math.random() * window.innerHeight,
            },
            at,
          );
        }
      });
      glitch.set(stage, { x: 0, skewX: 0 });
      glitch.set([ghostCyan, ghostPaper], { autoAlpha: 0, x: 0 });
      if (bars.length) glitch.set(bars, { autoAlpha: 0 });
      glitch.to({}, { duration: 0.04 });
      intro.add(glitch, 1.16);

      /* -------- Acto 3: impacto -------- */
      intro.call(() => setImpact(true), [], 1.3);

      intro.to(stage, { scale: 1.038, duration: 0.14, ease: "power2.out" }, 1.3);
      intro.to(
        stage,
        { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" },
        1.44,
      );

      intro.fromTo(
        flash,
        { autoAlpha: 0 },
        { autoAlpha: 0.4, duration: 0.09, yoyo: true, repeat: 1 },
        1.3,
      );

      diamonds.forEach((diamond) => {
        const dx = Number(diamond.dataset.dx ?? 0);
        const dy = Number(diamond.dataset.dy ?? 0);
        intro.fromTo(
          diamond,
          { x: 0, y: 0, autoAlpha: 1, scale: 1 },
          {
            x: dx,
            y: dy,
            autoAlpha: 0,
            scale: 0.25,
            duration: 0.55,
            ease: "power2.out",
          },
          1.33,
        );
      });

      /* -------- Panel de progreso: sello con corte diagonal -------- */
      intro.fromTo(
        panel,
        { autoAlpha: 0, y: 34, clipPath: "inset(0 0 100% 0)" },
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.6,
          ease: "power4.out",
        },
        1.24,
      );

      /* -------- Reloj: suelo de coreografia -------- */
      const clockTween = gsap.to(clock, {
        v: HOLD_AT,
        duration: MIN_INTRO,
        ease: "power1.inOut",
        onUpdate: paint,
        onComplete: maybeFinish,
      });

      /* Flotacion atmosferica del antifaz, ya revelado. */
      const floatTween = gsap.to(stage, {
        y: -7,
        duration: 3.6,
        delay: 1.9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      const glowTween = gsap.to(glow, {
        autoAlpha: 0.62,
        duration: 1.7,
        delay: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      /* ------------------------------------------------------------------
         Salida: cuchilla diagonal que revela el menu principal
         ------------------------------------------------------------------ */
      function startExit(fast: boolean) {
        if (finished) return;
        finished = true;
        exitingRef.current = true;
        markBooted();

        window.clearTimeout(safety);
        clockTween.kill();
        floatTween.kill();
        glowTween.kill();
        intro.pause();

        if (fast) {
          gsap.set([ink, fill], { clipPath: "none" });
          gsap.set(pen, { autoAlpha: 0 });
          gsap.set(panel, { autoAlpha: 1, y: 0, clipPath: "none" });
          gsap.set([top, hud], { autoAlpha: 1 });
        }

        paintCut();

        const speed = fast ? 0.55 : 1;

        exitTl = gsap.timeline({ onComplete: hide });

        exitTl.to(
          state,
          {
            shown: 100,
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => writeCounter(state.shown),
          },
          0,
        );

        if (count) {
          exitTl.to(
            count,
            { scale: 1.14, duration: 0.1, yoyo: true, repeat: 1 },
            0,
          );
        }

        exitTl.fromTo(
          flash,
          { autoAlpha: 0 },
          { autoAlpha: 0.5, duration: 0.08, yoyo: true, repeat: 1 },
          0.04,
        );

        exitTl.to(
          stage,
          {
            y: -78,
            scale: 1.12,
            autoAlpha: 0,
            duration: 0.55 * speed + 0.1,
            ease: "power3.in",
          },
          0.02,
        );

        exitTl.to(
          [panel, top, hud],
          { autoAlpha: 0, y: 16, duration: 0.24 * speed + 0.06 },
          0,
        );

        exitTl.set(blade, { autoAlpha: 1 }, 0.1 * speed);
        exitTl.to(
          state,
          {
            cut: 129,
            duration: 0.62 * speed + 0.1,
            ease: "power3.inOut",
            onUpdate: paintCut,
          },
          0.1 * speed,
        );
        exitTl.to(blade, { autoAlpha: 0, duration: 0.2 }, ">-0.18");
      }

      function maybeFinish() {
        if (finished) return;
        if (!readyRef.current) return;
        if (clock.v < HOLD_AT - 0.01) return;
        startExit(false);
      }

      finishRef.current = maybeFinish;
      forceRef.current = () => startExit(true);

      /* Red de seguridad: si algo se atasca, salir igualmente. */
      safety = window.setTimeout(() => {
        readyRef.current = true;
        maybeFinish();
      }, SAFETY_MS);
    }, root);

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("resize", onResize);
      repaintRef.current = null;
      finishRef.current = null;
      forceRef.current = null;
      exitTl?.kill();
      ctx.revert();
    };
    /* `hide` es estable; el resto son refs. */
  }, [hidden, reduced, maskReady, hide]);

  if (hidden) return null;

  const maskStyle: CSSProperties = {
    maskImage: `url(${MASK_SRC})`,
    WebkitMaskImage: `url(${MASK_SRC})`,
  };

  return (
    <>
      <div
        ref={rootRef}
        className="load-root fixed inset-0 z-[100] overflow-hidden bg-bg-hero text-paper"
        onPointerDown={skip}
      >
        <div aria-hidden="true" className="absolute inset-0">
          {/* Fondo: skyline real con rampa de brillo */}
          <div
            ref={bgRef}
            className="absolute inset-0"
            style={{
              backgroundImage: LOADING_BG,
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
            }}
          />

          {/* Rim-light rojo */}
          <div
            className="pointer-events-none absolute inset-x-0 h-[160px]"
            style={{
              top: "32%",
              background:
                "linear-gradient(to bottom, transparent, rgba(230,0,18,0.4) 50%, transparent)",
              filter: "blur(48px)",
              mixBlendMode: "screen",
              opacity: 0.22,
            }}
          />

          <ConcentricRings revealed={impact} reduced={reduced} />
          <div ref={hudRef} className="absolute inset-0">
            <HudCorners />
          </div>

          {/* HUD periferico superior */}
          <div
            ref={topRef}
            className="pointer-events-none absolute inset-x-0 top-0 z-40"
            style={reduced ? undefined : { opacity: 0 }}
          >
            <div className="flex items-center justify-between px-6 pt-6 text-label uppercase tracking-[0.3em] text-paper/45 md:px-10">
              <span className="flex items-center gap-2">
                <span className="inline-block size-[3px] bg-accent" />
                {profile.branding.system.toUpperCase()}
              </span>
              <span className="hidden sm:block">
                SISTEMA {profile.branding.version.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ============================ ANTIFAZ ============================ */}
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
            <div
              ref={stageRef}
              className="relative"
              style={{ willChange: "transform" }}
            >
              <div className="load-mask-frame">
                <div ref={glowRef} className="load-mask-glow" />

                {/* Copias de glitch (cian / papel) tras el alfa del PNG */}
                <div
                  ref={ghostCyanRef}
                  className="load-mask-ghost load-mask-ghost--cyan"
                  style={maskStyle}
                />
                <div
                  ref={ghostPaperRef}
                  className="load-mask-ghost load-mask-ghost--paper"
                  style={maskStyle}
                />

                {/* TRAZO: silueta de tinta roja, ligeramente crecida */}
                <div
                  ref={inkRef}
                  className="load-mask-ink"
                  style={{
                    ...maskStyle,
                    clipPath: reduced ? "none" : CLIP_ZERO,
                  }}
                />

                {/* RELLENO: la imagen real, 13 uds. por detras del trazo */}
                <div
                  ref={fillRef}
                  className="load-mask-fill"
                  style={{ clipPath: reduced ? "none" : CLIP_ZERO }}
                >
                  <img
                    ref={imgRef}
                    src={MASK_SRC}
                    alt=""
                    draggable={false}
                  />
                </div>

                {/* Trama de semitono que se disuelve sobre el relleno */}
                <div
                  ref={halftoneRef}
                  className="load-mask-halftone bg-halftone-red"
                  style={{ ...maskStyle, opacity: 0 }}
                />

                {/* Pluma: punta luminosa que dibuja el contorno */}
                <div ref={penRef} className="load-pen-track">
                  <span className="load-pen" />
                </div>

                {/* Diamantes del impacto */}
                <div ref={diamondsRef} className="absolute inset-0">
                  {DIAMONDS.map((diamond, index) => (
                    <span
                      key={index}
                      className="load-impact-diamond"
                      data-dx={diamond.dx}
                      data-dy={diamond.dy}
                      style={{
                        left: diamond.left,
                        top: diamond.top,
                        opacity: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Barras de glitch */}
          <div
            ref={barsRef}
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          >
            <span className="load-glitch-bar" />
            <span className="load-glitch-bar" />
            <span className="load-glitch-bar" />
          </div>

          {/* Destello de impacto */}
          <div ref={flashRef} className="load-flash" style={{ opacity: 0 }} />

          {/* Gradiente de legibilidad del panel */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[min(44vh,440px)]"
            style={{
              background:
                "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.82) 42%, transparent 100%)",
            }}
          />

          {/* ============================ PROGRESO ============================ */}
          <div
            ref={panelRef}
            className="pointer-events-none absolute bottom-0 right-0 z-40 w-[min(34rem,88vw)] pb-6 pr-4 sm:pb-12 sm:pr-8"
            style={reduced ? undefined : { opacity: 0 }}
          >
            <div className="load-panel">
              <div className="load-panel-inner px-3 py-3.5 sm:px-5 sm:py-5">
                <div className="flex items-stretch gap-3 sm:gap-4">
                  {/* Sello Q */}
                  <div className="flex shrink-0 items-center">
                    <span
                      aria-hidden="true"
                      className="font-anton text-[2.4rem] leading-none text-paper sm:text-[3.6rem] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,3px_3px_0_rgba(0,0,0,0.65)]"
                    >
                      Q
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-balance text-left font-anton uppercase leading-[1.05] text-paper"
                      style={{ fontSize: "clamp(0.95rem, 1.9vw, 1.6rem)" }}
                    >
                      {QUESTION.slice(0, -1)}
                      <span className="text-accent">?</span>
                    </p>

                    <div className="mt-2 flex items-center gap-2 sm:gap-3">
                      <div className="relative h-[22px] flex-1 [transform:skewX(-6deg)] sm:h-[38px]">
                        <div className="absolute inset-0 bg-paper [clip-path:polygon(0%_25%,100%_0%,100%_100%,0%_75%)]">
                          <div className="absolute inset-[3px] bg-bg-hero [clip-path:polygon(0%_25%,100%_0%,100%_100%,0%_75%)]">
                            <div
                              ref={barRef}
                              className="load-bar-fill absolute inset-y-0 left-0 w-full origin-left bg-accent"
                              style={{ transform: "scaleX(0)" }}
                            />
                          </div>
                        </div>
                      </div>

                      <span
                        ref={countRef}
                        className="load-pct inline-flex shrink-0 flex-col items-end leading-none"
                      >
                        <span className="mb-1 font-digital text-[8px] uppercase tracking-[0.3em] text-paper/55 sm:text-[9px]">
                          Si
                        </span>
                        <span className="font-anton text-[1.7rem] text-accent [transform:skewX(-10deg)] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000,-3px_-3px_0_#000,3px_-3px_0_#000,-3px_3px_0_#000,3px_3px_0_#000,4px_4px_0_rgba(0,0,0,0.5)] sm:text-[2.4rem]">
                          <span className="inline-block min-w-[3.2ch] text-right tabular-nums">
                            <span ref={pctRef}>00</span>%
                          </span>
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between font-digital text-[9px] uppercase tracking-[0.26em] text-paper/45 sm:text-[10px]">
                      <span ref={statusRef}>INICIANDO</span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-[3px] bg-accent" />
                        REC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saltar: click en cualquier sitio o cualquier tecla */}
        <button
          type="button"
          onClick={skip}
          onPointerDown={(event) => event.stopPropagation()}
          data-cursor="select"
          aria-label="Saltar la animacion de carga"
          className="load-skip absolute left-5 top-16 z-50 sm:bottom-20 sm:left-8 sm:top-auto"
        >
          <span className="load-skip__label">Saltar</span>
          <span className="load-skip__hint">Click / Tecla</span>
        </button>
      </div>

      {/* Cuchilla de salida: capa propia para que el resplandor pueda
          derramarse sobre el menu ya revelado sin que la recorte el clip. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[101] overflow-hidden"
      >
        <div ref={bladeRef} className="load-blade" style={{ opacity: 0 }}>
          <span className="load-blade__body" />
          <span className="load-blade__edge" />
          <span className="load-blade__trail" />
        </div>
      </div>
    </>
  );
}
