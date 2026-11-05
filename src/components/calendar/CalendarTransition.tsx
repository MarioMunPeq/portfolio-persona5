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
 * ANIMACIÓN DE CAÍDA DE LOS DÍAS (una sola gsap.timeline):
 *   - Cada día tiene un wrapper exterior (position:absolute, left:0, top:0
 *     dentro del ancla CSS que define su posición final). GSAP anima SOLO
 *     la propiedad y del wrapper. Nada de x, left, top, rotation o scale.
 *   - La rotación de cada día va fija en el elemento interior (CSS estático).
 *   1. Los 6 días que NO son hoy caen TODOS A LA VEZ (stagger: 0), desde
 *      fuera de pantalla por arriba (y: -(viewport height + 200px)) hasta
 *      y: 0, duration 0.5s, ease "power4.in". Todos aterrizan al mismo
 *      instante: PUM.
 *   2. En el impacto: shake de pantalla (±8px, 0.35s, amortiguado) y los
 *      números de esos 6 días tiemblan (±3px, 0.3s) sobre su contenido
 *      interior, volviendo exactamente a su posición.
 *   3. Con el impacto (≈0.08s después), cae HOY en el centro por su propio
 *      peso: y desde fuera de pantalla hasta 0, vertical, 0.5s,
 *      "power4.in", con un shake más fuerte al aterrizar (±12px, 0.45s)
 *      y rebote mínimo.
 *   4. onComplete de la timeline: pausa y salida a negro ya existentes.
 *
 * El cuchillo está fuera de alcance (por requisito) y no se renderiza.
 *
 * Interacción:
 *   Clic en cualquier parte del overlay, Escape o Space salta la
 *   introducción y revela el home inmediatamente.
 *
 * ARQUITECTURA DOM:
 *   .calendar-ancla   — posición final de la fecha (left/top % sobre el
 *                        contenedor del calendario) con translate(-50%,-50%)
 *                        para centrar la composición sobre el punto.
 *                        Definido en CSS; GSAP NO lo toca.
 *   .calendar-card    — composición de la fecha dentro del ancla. GSAP anima
 *                        SOLO su y durante la caída. Nada de x, left, top,
 *                        rotation ni scale.
 *   .calendar-content — contenido interior (número + imagen), rotación
 *                        estática en CSS.
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
import { CalendarCard, NUMBER_ROTATION_BY_INDEX } from "./CalendarCard";

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
 * Constantes de la animación de caída (ajustar a mano).
 */
const FALL_S = 0.55;               // duración de la caída de cada día (s)
const START_ROT_DEG_MIN = 14;      // rotación inicial extra mínima (grados)
const START_ROT_DEG_MAX = 28;      // rotación inicial extra máxima (grados)
const SQUASH_Y = 0.88;             // escala Y en el squash de impacto (días normales)
const SHAKE_PX = 14;               // desplazamiento máximo de shake de pantalla (px)
const SHAKE_TODAY_PX = 5;          // desplazamiento de shake de pantalla para hoy (px)
const ZOOM_PUNCH = 1.025;          // factor de zoom micro en el impacto
const DUST_COUNT = 10;             // número de partículas de polvo por día

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
  const contentRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));
  const flashRef = useRef<HTMLDivElement>(null);
  const dustContainerRef = useRef<HTMLDivElement>(null);

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
   *   - Finalización normal de la secuencia de salida (onComplete de la timeline)
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

  // ---------- Animación de caída del calendario (GSAP timeline) ----------
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
      contentRefs.current.some((ref) => ref === null) ||
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

    const vh = window.innerHeight;

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

    // ---------- Rotación inicial: cada día parte girado respecto a su rotación final ----------
    // Signo alterno y valores distintos por día (14°–28°). Se endereza durante la caída.
    const startRotByIndex: Record<number, number> = {};
    [0, 1, 3, 4, 5, 6, 2].forEach((i) => {
      const sign = i % 2 === 0 ? 1 : -1;
      const spread = START_ROT_DEG_MIN + ((i % 6) / 5) * (START_ROT_DEG_MAX - START_ROT_DEG_MIN);
      startRotByIndex[i] = sign * spread;
    });

    // ---------- Estado inicial: todos los días fuera de pantalla por arriba ----------
    // GSAP anima solo y del wrapper y rotation del content. Nada de x, left, top.
    const allWrappers = visualRefs.current.filter(
      (ref): ref is HTMLDivElement => ref !== null
    );
    tl.set(allWrappers, { y: -(vh + 250), filter: "blur(3px)" }, 0);

    [0, 1, 3, 4, 5, 6, 2].forEach((i) => {
      const content = contentRefs.current[i];
      if (!content) return;
      const rotFinal = NUMBER_ROTATION_BY_INDEX[i];
      tl.set(content, {
        rotation: rotFinal + startRotByIndex[i],
        transformOrigin: "50% 50%",
      }, 0);
    });

    // ---------- FASE 1 — LOS 6 DÍAS QUE NO SON HOY CAEN TODOS A LA VEZ ----------
    // Caen simultáneamente (stagger: 0), mismo instante de impacto: PUM.
    const fallStart = T.datesStart;
    const otherIndices = [0, 1, 3, 4, 5, 6];
    const impactTime = fallStart + FALL_S;

    otherIndices.forEach((i) => {
      const wrapper = visualRefs.current[i];
      const content = contentRefs.current[i];
      if (!wrapper || !content) return;

      // Caída vertical: y + motion blur → 0. Solo y del wrapper, rotation del content.
      tl.fromTo(
        wrapper,
        { y: -(vh + 250), filter: "blur(3px)" },
        {
          y: 0,
          filter: "blur(0px)",
          duration: FALL_S,
          ease: "power4.in",
        },
        fallStart
      );

      tl.to(content, {
        rotation: NUMBER_ROTATION_BY_INDEX[i],
        transformOrigin: "50% 50%",
        duration: FALL_S,
        ease: "power4.in",
      }, fallStart);
    });

    // ---------- IMPACTO de los 6 días ----------
    // Squash: scaleY 0.88 → 1 (elastic, origen en la base).
    otherIndices.forEach((i) => {
      const wrapper = visualRefs.current[i];
      if (!wrapper) return;
      tl.to(wrapper, { scaleY: SQUASH_Y, transformOrigin: "50% 100%", duration: 0.06 }, impactTime);
      tl.to(wrapper, { scaleY: 1, duration: 0.35, ease: "elastic.out(1, 0.5)" }, impactTime + 0.06);

      // Rebote seco en y: 0 → -14px → 0 (un solo rebote).
      tl.to(wrapper, { y: -SHAKE_PX, duration: 0.12, ease: "power2.out" }, impactTime);
      tl.to(wrapper, { y: 0, duration: 0.14, ease: "power3.in" }, impactTime + 0.12);
    });

    // Temblor de los números (content): rotación ±4° y y ±3px, 0.45s, vuelven EXACTAMENTE al valor final.
    otherIndices.forEach((i) => {
      const content = contentRefs.current[i];
      if (!content) return;
      const rotFinal = NUMBER_ROTATION_BY_INDEX[i];
      const d = 0.45;
      tl.to(content, {
        keyframes: [
          { rotation: rotFinal + 4, y: 3, duration: d / 3, ease: "power2.in" },
          { rotation: rotFinal - 4, y: -3, duration: d / 3, ease: "power2.inOut" },
          { rotation: rotFinal, y: 0, duration: d / 3, ease: "power2.out" },
        ],
      }, impactTime);
    });

    // Shake de pantalla: contenedor raíz con decaimiento ±14px, ±6px, ±3px, 0 en 0.5s.
    tl.to(containerRef.current, {
      keyframes: [
        { x: SHAKE_PX, y: SHAKE_PX * 0.5, duration: 0.125, ease: "power2.in" },
        { x: -SHAKE_PX * 0.5, y: -SHAKE_PX * 0.5, duration: 0.125, ease: "power2.inOut" },
        { x: SHAKE_PX * 0.25, y: SHAKE_PX * 0.25, duration: 0.125, ease: "power2.inOut" },
        { x: 0, y: 0, duration: 0.125, ease: "power2.out" },
      ],
    }, impactTime);

    // Micro zoom punch: scale 1 → 1.025 → 1 en 0.3s.
    tl.to(containerRef.current, { scale: ZOOM_PUNCH, duration: 0.15, ease: "power2.in" }, impactTime);
    tl.to(containerRef.current, { scale: 1, duration: 0.15, ease: "power2.out" }, impactTime + 0.15);

    // Flash blanco: opacity 0.22 → 0 en 0.1s sobre toda la pantalla.
    tl.to(flashRef.current, { opacity: 0.22, duration: 0.05 }, impactTime);
    tl.to(flashRef.current, { opacity: 0, duration: 0.05 }, impactTime + 0.05);

    // Polvo: partículas salen de la base de cada día en abanico y desaparecen en 0.5s.
    otherIndices.forEach((i) => {
      const wrapper = visualRefs.current[i];
      const dustContainer = dustContainerRef.current;
      if (!wrapper || !dustContainer) return;
      tl.call(
        () => {
          const rect = wrapper.getBoundingClientRect();
          const baseX = rect.left + rect.width / 2;
          const baseY = rect.bottom;
          const count = DUST_COUNT;
          for (let p = 0; p < count; p++) {
            const particle = document.createElement("div");
            const size = 6 + Math.random() * 8;
            particle.style.position = "absolute";
            particle.style.left = `${baseX}px`;
            particle.style.top = `${baseY}px`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = `rgba(245, 245, 240, ${0.4 + Math.random() * 0.4})`;
            particle.style.opacity = "0.5";
            particle.style.borderRadius = "50%";
            particle.style.pointerEvents = "none";
            particle.style.zIndex = "45";
            dustContainer.appendChild(particle);

            const angle = (-Math.PI / 2) + (p / count) * Math.PI * 0.6 - Math.PI * 0.3;
            const speed = 40 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            tl.to(particle, {
              x: vx,
              y: vy,
              opacity: 0,
              duration: 0.5,
              ease: "power2.out",
              onComplete: () => particle.remove(),
            }, impactTime);
          }
        },
        [],
        impactTime
      );
    });

    // ---------- FASE 2 — HOY CAE 0.1s DESPUÉS DEL IMPACTO ----------
    const hoyIndex = 2;
    const hoyWrapper = visualRefs.current[hoyIndex];
    const hoyContent = contentRefs.current[hoyIndex];
    const hoyTime = impactTime + 0.1;

    if (hoyWrapper && hoyContent) {
      const hoyRotFinal = NUMBER_ROTATION_BY_INDEX[hoyIndex];

      // Caída de hoy: misma rotación inicial extra, power4.in, FALL_S.
      tl.fromTo(
        hoyWrapper,
        { y: -(vh + 250), filter: "blur(3px)" },
        { y: 0, filter: "blur(0px)", duration: FALL_S, ease: "power4.in" },
        hoyTime
      );

      tl.to(hoyContent, {
        rotation: hoyRotFinal,
        transformOrigin: "50% 50%",
        duration: FALL_S,
        ease: "power4.in",
      }, hoyTime);

      const hoyLandTime = hoyTime + FALL_S;

      // Squash más suave: 0.94.
      tl.to(hoyWrapper, { scaleY: 0.94, transformOrigin: "50% 100%", duration: 0.06 }, hoyLandTime);
      tl.to(
        hoyWrapper,
        { scaleY: 1, duration: 0.35, ease: "elastic.out(1, 0.5)" },
        hoyLandTime + 0.06
      );

      // Rebote: -7px.
      tl.to(hoyWrapper, { y: -7, duration: 0.12, ease: "power2.out" }, hoyLandTime);
      tl.to(hoyWrapper, { y: 0, duration: 0.14, ease: "power3.in" }, hoyLandTime + 0.12);

      // Número de hoy tiembla suave ±1.5° y ±1.5px.
      tl.to(hoyContent, {
        keyframes: [
          { rotation: hoyRotFinal + 1.5, y: 1.5, duration: 0.1, ease: "power2.in" },
          { rotation: hoyRotFinal - 1.5, y: -1.5, duration: 0.1, ease: "power2.inOut" },
          { rotation: hoyRotFinal, y: 0, duration: 0.1, ease: "power2.out" },
        ],
      }, hoyLandTime);

      // Los otros 6 números tiemblan solo ±1.5° y ±1.5px (0.3s), no más.
      const d2 = 0.3;
      otherIndices.forEach((i) => {
        const content = contentRefs.current[i];
        if (!content) return;
        const rotFinal = NUMBER_ROTATION_BY_INDEX[i];
        tl.to(content, {
          keyframes: [
            { rotation: rotFinal + 1.5, y: 1.5, duration: d2 / 3, ease: "power2.in" },
            { rotation: rotFinal - 1.5, y: -1.5, duration: d2 / 3, ease: "power2.inOut" },
            { rotation: rotFinal, y: 0, duration: d2 / 3, ease: "power2.out" },
          ],
        }, hoyLandTime);
      });

      // Shake de pantalla hoy: ±5px/±2px/0 en 0.35s.
      tl.to(containerRef.current, {
        keyframes: [
          { x: SHAKE_TODAY_PX, y: SHAKE_TODAY_PX * 0.4, duration: 0.116, ease: "power2.in" },
          { x: -SHAKE_TODAY_PX * 0.4, y: -SHAKE_TODAY_PX * 0.4, duration: 0.117, ease: "power2.inOut" },
          { x: 0, y: 0, duration: 0.117, ease: "power2.out" },
        ],
      }, hoyLandTime);

      // Micro zoom hoy: 1.012.
      tl.to(containerRef.current, { scale: 1.012, duration: 0.15, ease: "power2.in" }, hoyLandTime);
      tl.to(containerRef.current, { scale: 1, duration: 0.15, ease: "power2.out" }, hoyLandTime + 0.15);

      // Flash hoy: 0.12.
      tl.to(flashRef.current, { opacity: 0.12, duration: 0.06 }, hoyLandTime);
      tl.to(flashRef.current, { opacity: 0, duration: 0.06 }, hoyLandTime + 0.06);

      // Polvo hoy: 6 partículas.
      const dustContainerToday = dustContainerRef.current;
      if (dustContainerToday) {
        tl.call(
          () => {
            const rect = hoyWrapper.getBoundingClientRect();
            const baseX = rect.left + rect.width / 2;
            const baseY = rect.bottom;
            const count = 6;
            for (let p = 0; p < count; p++) {
              const particle = document.createElement("div");
              const size = 6 + Math.random() * 8;
              particle.style.position = "absolute";
              particle.style.left = `${baseX}px`;
              particle.style.top = `${baseY}px`;
              particle.style.width = `${size}px`;
              particle.style.height = `${size}px`;
              particle.style.background = `rgba(245, 245, 240, ${0.4 + Math.random() * 0.4})`;
              particle.style.opacity = "0.5";
              particle.style.borderRadius = "50%";
              particle.style.pointerEvents = "none";
              particle.style.zIndex = "45";
              dustContainerToday.appendChild(particle);

              const angle = (-Math.PI / 2) + (p / count) * Math.PI * 0.6 - Math.PI * 0.3;
              const speed = 40 + Math.random() * 60;
              const vx = Math.cos(angle) * speed;
              const vy = Math.sin(angle) * speed;

              tl.to(particle, {
                x: vx,
                y: vy,
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => particle.remove(),
              }, hoyLandTime);
            }
          },
          [],
          hoyLandTime
        );
      }

      // ---------- Final de la timeline ----------
      // Lanza la pausa y la salida a negro (startExit).
      tl.to({}, { duration: 0, onComplete: startExit }, hoyLandTime + 0.5);
    }

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
                  className="calendar-ancla"
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  } as React.CSSProperties}
                >
                  <CalendarCard
                    date={date}
                    index={index}
                    wrapperRef={(el: HTMLDivElement | null) => {
                      visualRefs.current[index] = el;
                    }}
                    contentRef={(el: HTMLDivElement | null) => {
                      contentRefs.current[index] = el;
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Flash blanco de impacto (cubre toda la pantalla)} */}
          <div
            ref={flashRef}
            className="fixed inset-0 bg-white"
            style={{ zIndex: 50, opacity: 0, pointerEvents: "none" }}
          />

          {/* Contenedor de partículas de polvo (cubre toda la pantalla)} */}
          <div
            ref={dustContainerRef}
            className="fixed inset-0"
            style={{ zIndex: 45, pointerEvents: "none" }}
          />
        </>
      )}
    </div>
  );
}

CalendarTransition.displayName = "CalendarTransition";
