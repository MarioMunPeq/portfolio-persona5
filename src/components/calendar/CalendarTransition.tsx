/**
 * Pantalla de introducción tipo Persona 5 — transición de calendario.
 *
 * Sustituye a LoadScreen como única pantalla de arranque. Reutiliza la
 * arquitectura de arranque existente (boot.ts, markBooted/useBooted) para
 * que el ciclo de vida del home y el resto de la aplicación quede intacto.
 *
 * Coreografía (GSAP, una sola timeline coordinada):
 *   ENTRADA:
 *     - Overlay negro opaco (opacity 1) montado desde el primer render.
 *     - Preload de imágenes (fondo día/noche + PNGs de días de semana).
 *     - Al cargar: overlay fade-out 1→0 (~1.2s), calendario aparece debajo.
 *   SALIDA:
 *     - Al terminar: overlay fade-in 0→1 (~0.8s).
 *     - Overlay a opacity 1 (pantalla negra): se desmonta el calendario y
 *       se marca el arranque para montar el home.
 *     - Pausa ~200ms en negro.
 *     - Overlay fade-out 1→0 (~0.8s) revelando el home.
 *
 * El cuchillo está fuera de alcance (por requisito) y no se renderiza.
 *
 * Interacción:
 *   Clic en cualquier parte del overlay, Escape o Space salta la
 *   introducción y revela el home inmediatamente.
 *
 * ARQUITECTURA DOM (ver tokens.css §CALENDAR TRANSITION):
 *   .calendar-anchor   — posición final de la fecha (left/top %),
 *                        centrado con translate(-50%, -50%) en CSS.
 *                        GSAP NO lo anima.
 *   .calendar-visual   — envoltorio animado por GSAP (x/y/scale/rotation).
 *                        Está dentro del ancla, así sus traslaciones son
 *                        relativas al centro de la composición.
 *   .calendar-card     — número (arriba) + PNG del weekday (abajo),
 *                        centrados como un solo lockup vertical.
 *
 * Cada fecha muestra: hoy-2, hoy-1 (ayer), hoy, hoy+1, hoy+2, hoy+3,
 * hoy+4 (buffer a la derecha para continuidad del desplazamiento).
 */
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { markBooted } from "../../lib/boot";
import { useMediaQuery } from "../../lib/use-media-query";
import {
  getCalendarDates,
  getDayNight,
  calendarAsset,
  type CalendarDate,
} from "../../lib/calendar";
import { CalendarCard } from "./CalendarCard";

/**
 * Marca a nivel de módulo para evitar que React 19 StrictMode vuelva a
 * mostrar el calendario después de que ya se completó.
 */
let introCompleted = false;

/**
 * Duraciones de las transiciones del overlay (ms).
 * Se definen como constantes arriba del archivo para ajustarlas a mano.
 */
const FADE_OUT_MS = 1200; // overlay fade-out al entrar (opacity 1→0)
const FADE_IN_MS = 800;   // overlay fade-in al salir (opacity 0→1)
const BLACK_HOLD_MS = 200; // pausa en negro entre calendario y home

/**
 * Desplazamiento horizontal inicial (puntos porcentuales del viewport).
 */
const INITIAL_SHIFT_PCT = 22;

/**
 * POSICIONES FINALES (después del desplazamiento hacia la izquierda):
 * Hoy en el centro (x=50%), ayer a su izquierda (x=28%).
 * Coordenadas porcentuales de referencia de Persona 5, adaptables al
 * viewport (no son píxeles hardcodeados).
 *   0 = hoy-2, 1 = hoy-1 (ayer), 2 = HOY, 3 = hoy+1, 4 = hoy+2,
 *   5 = hoy+3, 6 = hoy+4 (buffer a la derecha).
 */
const CARD_POSITIONS: Record<string, { x: number; y: number; scale: number }[]> = {
  desktop: [
    { x: 8,  y: 46, scale: 0.60 },   // hoy-2
    { x: 28, y: 55, scale: 0.75 },   // ayer
    { x: 50, y: 59, scale: 1.00 },   // HOY (centro tras el shift)
    { x: 64, y: 47, scale: 0.75 },   // hoy+1
    { x: 78, y: 37, scale: 0.60 },   // hoy+2
    { x: 91, y: 36, scale: 0.45 },   // hoy+3
    { x: 104, y: 46, scale: 0.45 },  // hoy+4 (buffer)
  ],
  tablet: [
    { x: 12, y: 44, scale: 0.50 },
    { x: 30, y: 52, scale: 0.65 },
    { x: 50, y: 56, scale: 1.00 },
    { x: 66, y: 46, scale: 0.65 },
    { x: 80, y: 40, scale: 0.50 },
    { x: 90, y: 38, scale: 0.38 },
    { x: 100, y: 44, scale: 0.38 },
  ],
  mobile: [
    { x: 18, y: 42, scale: 0.42 },
    { x: 34, y: 48, scale: 0.55 },
    { x: 50, y: 52, scale: 1.00 },
    { x: 66, y: 44, scale: 0.55 },
    { x: 82, y: 40, scale: 0.42 },
    { x: 90, y: 38, scale: 0.32 },
    { x: 100, y: 42, scale: 0.32 },
  ],
};

/** Instantes clave de la timeline (segundos). */
const T = {
  bgStart: 0,
  datesStart: 0.55,
};

/** Tiempo de pausa tras el desplazamiento antes de iniciar la salida. */
const HOLD_AFTER_SHIFT_S = 0.5;

/** Tiempo máximo antes de forzar la salida aunque algo falle. */
const SAFETY_MS = 10000;

type Breakpoint = "desktop" | "tablet" | "mobile";

export function CalendarTransition() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dates: CalendarDate[] = useMemo(() => getCalendarDates(), []);
  const dayNight = useMemo(() => getDayNight(), []);
  const bgSrc = useMemo(
    () => calendarAsset(dayNight === "day" ? "calendar_day.png" : "calendar_night.png"),
    [dayNight]
  );

  // ---------- Estado del overlay (única capa reutilizada en ambas transiciones) ----------
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [exitComplete, setExitComplete] = useState(false);

  const [hidden, setHidden] = useState(introCompleted);
  const [isPositioned, setIsPositioned] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));

  const isMountedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const timelineCreatedRef = useRef(false);

  const breakpoint = useMemo<Breakpoint>(() => {
    const w = window.innerWidth;
    if (w >= 1024) return "desktop";
    if (w >= 640) return "tablet";
    return "mobile";
  }, []);

  /** Bloquea el scroll mientras la introducción está activa. */
  const lockScroll = useCallback((lock: boolean) => {
    if (lock) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
  }, []);

  /**
   * Camino de finalización idempotente. Usado por:
   *   - Finalización normal de la secuencia de salida (onComplete)
   *   - Clic / Escape / Space sobre el overlay (salto de introducción)
   *   - Temporizador de seguridad (10 s)
   */
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    introCompleted = true;

    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }

    lockScroll(false);

    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    // Salto directo a pantalla negra: fade-in del overlay, ocultar calendario,
    // marcar booted y terminar.
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: FADE_IN_MS / 1000,
      ease: "power2.in",
      onComplete: () => {
        setOverlayOpacity(1);
        setShowCalendar(false);
        markBooted();
        setExitComplete(true);
        setHidden(true);
      },
    });
  }, [lockScroll]);

  // Reduced motion: mostrar estado final inmediato, sin animación.
  useEffect(() => {
    if (reduced) {
      lockScroll(false);
      introCompleted = true;
      setHidden(true);
      markBooted();
    }
  }, [reduced, lockScroll]);

  // Auto-enfoca el overlay y escucha Escape/Space en el documento.
  useEffect(() => {
    if (reduced || hidden || introCompleted) return;
    rootRef.current?.focus();
    const onDocKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.key !== " ") return;
      event.preventDefault();
      finish();
    };
    document.addEventListener("keydown", onDocKey);
    return () => {
      document.removeEventListener("keydown", onDocKey);
    };
  }, [reduced, hidden, finish]);

  // Montaje: bloquear scroll y marcar que los componentes están posicionados.
  useEffect(() => {
    if (reduced || hidden || introCompleted) return;
    lockScroll(true);
    setIsPositioned(true);
    return () => {
      lockScroll(false);
    };
  }, [reduced, hidden, lockScroll]);

  // ---------- Preload de imágenes con new Image() + onload / decode() ----------
  // El calendario no se muestra hasta que todas las imágenes estén cargadas.
  useEffect(() => {
    const sources: string[] = [
      calendarAsset("calendar_day.png"),
      calendarAsset("calendar_night.png"),
      ...dates.map((d) => calendarAsset(d.weekdayFile)),
    ];

    let loadedCount = 0;
    const total = sources.length;

    const onAssetSettled = () => {
      loadedCount++;
      if (loadedCount >= total) {
        setImagesLoaded(true);
      }
    };

    sources.forEach((src) => {
      const img = new Image();
      img.onload = onAssetSettled;
      img.onerror = onAssetSettled;
      img.src = src;
    });
  }, [dates]);

  // ---------- ENTRADA: fade-out del overlay cuando las imágenes están listas ----------
  useEffect(() => {
    if (!imagesLoaded || reduced || introCompleted || !isPositioned) return;

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: FADE_OUT_MS / 1000,
      ease: "power2.out",
      onComplete: () => {
        setOverlayOpacity(0);
        setShowCalendar(true); // el calendario aparece debajo del overlay
      },
    });
  }, [imagesLoaded, reduced, introCompleted, isPositioned]);

  // ---------- SALIDA: overlay fade-in → ocultar calendario → pausa → overlay fade-out ----------
  const startExit = useCallback(() => {
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: FADE_IN_MS / 1000,
      ease: "power2.in",
      onComplete: () => {
        setOverlayOpacity(1);
        // Pantalla negra: ocultar calendario y montar el home
        setShowCalendar(false);
        markBooted();

        // Pequeña pausa en negro, luego fade-out revelando el menú
        setTimeout(() => {
          gsap.to(overlayRef.current, {
            opacity: 0,
            duration: FADE_OUT_MS / 1000,
            ease: "power2.out",
            onComplete: () => {
              setOverlayOpacity(0);
              setExitComplete(true);
              setHidden(true);
            },
          });
        }, BLACK_HOLD_MS);
      },
    });
  }, []);

  // ---------- Animación del calendario (GSAP timeline) ----------
  useEffect(() => {
    if (
      !showCalendar ||
      hidden ||
      reduced ||
      introCompleted ||
      !isPositioned ||
      !bgRef.current ||
      !containerRef.current ||
      visualRefs.current.some((ref) => ref === null) ||
      timelineCreatedRef.current
    ) {
      return;
    }

    isMountedRef.current = true;
    timelineCreatedRef.current = true;

    // Temporizador de seguridad: nunca dejar la app bloqueada en el intro.
    safetyRef.current = setTimeout(() => {
      if (isMountedRef.current && !finishedRef.current) {
        finish();
      }
    }, SAFETY_MS);

    const positions = CARD_POSITIONS[breakpoint];
    const vw = window.innerWidth;
    const px = (pct: number) => vw * (pct / 100);

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tlRef.current = tl;

    // ---------- ACT 1 — LA CIUDAD ----------
    tl.fromTo(
      bgRef.current,
      { scale: 1.25, autoAlpha: 0.25 },
      { scale: 1, autoAlpha: 1, duration: 1.4, ease: "power3.out" },
      T.bgStart
    );

    // Movimiento sutil de cámara (ken burns lento)
    tl.to(
      bgRef.current,
      { scale: 1.05, duration: 4.0, ease: "sine.inOut" },
      T.bgStart + 0.4
    );

    // ---------- ACT 2 — LAS FECHAS QUE NO SON HOY CAEN PRIMERO ----------
    // Los seis índices que no son hoy caen todos a la vez, sin
    // desplazamiento lateral, directamente a su posición final.
    const fallDuration = 0.4;
    const otherIndices = [0, 1, 3, 4, 5, 6];
    otherIndices.forEach((i) => {
      const ref = visualRefs.current[i];
      if (!ref) return;
      const pos = positions[i];

      tl.fromTo(
        ref,
        {
          x: px(INITIAL_SHIFT_PCT),
          y: -750,
          scale: 0.15,
          rotation: -7,
          autoAlpha: 0,
        },
        {
          x: px(INITIAL_SHIFT_PCT),
          y: 0,
          scale: pos.scale,
          rotation: 0,
          autoAlpha: 1,
          duration: fallDuration,
          ease: "power4.in",
          clearProps: "rotation",
        },
        T.datesStart
      );

      tl.to(
        ref,
        { scaleY: 0.75, scaleX: 1.2, duration: 0.09, ease: "power2.in" },
        T.datesStart + fallDuration
      );

      tl.to(
        ref,
        { scaleY: 1.08, scaleX: 0.92, duration: 0.14, ease: "power2.out" },
        T.datesStart + fallDuration + 0.09
      );

      tl.to(
        ref,
        { scaleY: pos.scale, scaleX: pos.scale, duration: 0.16, ease: "power2.out" },
        T.datesStart + fallDuration + 0.09 + 0.14
      );
    });

    // Sacudida de pantalla sincronizada con el impacto de las fechas
    tl.to(
      containerRef.current,
      {
        x: () => (Math.random() > 0.5 ? 16 : -16),
        y: () => (Math.random() > 0.5 ? 14 : -14),
        duration: 0.025,
        repeat: 14,
        yoyo: true,
        ease: "none",
      },
      T.datesStart + fallDuration
    );

    tl.add("otherDatesLanded");

    // ---------- ACT 3 — HOY CAE ÚLTIMO ----------
    const hoyIndex = 2;
    const hoyRef = visualRefs.current[hoyIndex];
    const hoyFallDuration = 0.3;
    const hoyPos = positions[hoyIndex];

    if (hoyRef) {
      tl.fromTo(
        hoyRef,
        {
          x: px(INITIAL_SHIFT_PCT),
          y: -750,
          scale: 0.15,
          rotation: -14,
          autoAlpha: 0,
        },
        {
          x: px(INITIAL_SHIFT_PCT),
          y: 0,
          scale: hoyPos.scale,
          rotation: 0,
          autoAlpha: 1,
          duration: hoyFallDuration,
          ease: "power4.in",
          clearProps: "rotation",
        },
        T.datesStart + fallDuration + 0.09 + 0.14 + 0.16
      );

      tl.to(
        hoyRef,
        { scaleY: 0.75, scaleX: 1.2, duration: 0.09, ease: "power2.in" },
        T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration
      );

      tl.to(
        hoyRef,
        { scaleY: 1.08, scaleX: 0.92, duration: 0.14, ease: "power2.out" },
        T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration + 0.09
      );

      tl.to(
        hoyRef,
        { scaleY: hoyPos.scale, scaleX: hoyPos.scale, duration: 0.16, ease: "power2.out" },
        T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration + 0.09 + 0.14
      );
    }

    tl.add("hoyLanded");
    tl.add("allDatesLanded");

    // Pausa antes del desplazamiento (posición relativa al final real de las fechas)
    tl.add("calendarShift", "+=" + 1.0);

    // ---------- ACT 4 — EL CALENDARIO SE DESPLAZA HACIA LA IZQUIERDA ----------
    tl.to(
      visualRefs.current.filter((ref): ref is HTMLDivElement => ref !== null),
      { x: 0, duration: 1.0, ease: "power2.inOut" },
      "calendarShift"
    );

    // ---------- SALIDA: iniciar secuencia de overlay ----------
    tl.to({}, { duration: HOLD_AFTER_SHIFT_S, onComplete: startExit });

    return () => {
      isMountedRef.current = false;
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      tlRef.current = null;
    };
  }, [showCalendar, hidden, reduced, introCompleted, isPositioned, breakpoint, startExit]);

  if (hidden || exitComplete || introCompleted) return null;

  return (
    <div
      ref={rootRef}
      className="calendar-transition fixed inset-0 z-[100] bg-black text-white"
      onPointerDown={finish}
      onKeyDown={(e) => {
        if (e.key !== "Escape" && e.key !== " ") return;
        e.preventDefault();
        finish();
      }}
      tabIndex={-1}
    >
      {/* Overlay negro — capa única reutilizada en ambas transiciones.
          Arranca con opacity:1 (montado desde el primer render).
          pointer-events:none cuando está a opacity 0. */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black"
        style={{
          zIndex: 9999,
          opacity: overlayOpacity,
          pointerEvents: overlayOpacity === 0 ? "none" : "auto",
        }}
        onPointerDown={finish}
      />

      {/* Contenido del calendario (solo visible tras el fade-out de entrada) */}
      {showCalendar && (
        <>
          {/* Fondo ciudad — día o noche según hora local */}
          <div
            ref={bgRef}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Contenedor de anclas del calendario (cubre el viewport) */}
          <div ref={containerRef} className="absolute inset-0">
            {dates.map((date, index) => {
              const pos = CARD_POSITIONS[breakpoint][index];
              return (
                <div
                  key={index}
                  className="calendar-anchor"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  } as React.CSSProperties}
                >
                  <div
                    ref={(el) => {
                      visualRefs.current[index] = el;
                    }}
                    className="calendar-visual"
                  >
                    <CalendarCard date={date} index={index} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

CalendarTransition.displayName = "CalendarTransition";
