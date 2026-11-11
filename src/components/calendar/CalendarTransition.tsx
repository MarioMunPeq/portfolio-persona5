/**
 * Pantalla de introduccion tipo Persona 5 — transicion de calendario.
 *
 * Sustituye a LoadScreen como unica pantalla de arranque. Reutiliza la
 * arquitectura de arranque existente (boot.ts, markBooted/useBooted) para
 * que el ciclo de vida del home y el resto de la aplicacion quede intacto.
 *
 * Coreografia (GSAP, una sola timeline coordinada):
 *   ENTRADA:
 *     - Overlay negro opaco (opacity 1) montado desde el primer render.
 *     - Preload de imagenes (fondo dia/noche + PNGs de dias de semana).
 *     - Al cargar: overlay fade-out 1→0 (~1.2s), calendario aparece debajo.
 *   SALIDA:
 *     - Al terminar: overlay fade-in 0→1 (~0.8s).
 *     - Overlay a opacity 1 (pantalla negra): se desmonta el calendario y
 *       se marca el arranque para montar el home.
 *     - Pausa ~200ms en negro.
 *     - Overlay fade-out 1→0 (~0.8s) revelando el home.
 *
 * ANIMACION DE CAIDA DE LOS DIAS (una sola gsap.timeline):
 *   - Cada dia tiene un wrapper exterior (position:absolute, left:0, top:0
 *     dentro del ancla CSS que define su posicion final). GSAP anima SOLO
 *     la propiedad y del wrapper. Nada de x, left, top, rotation o scale.
 *   - La rotacion de cada dia va fija en el elemento interior (CSS estatico).
 *   1. Los 5 dias que NO son hoy caen a la vez y aterrizan juntos: PUM.
 *   2. El impacto comprime las fechas y transmite una onda vertical corta
 *      al fondo y a la pagina, sin destello ni vibracion lateral.
 *   3. La onda desencadena la caida de HOY, que aterriza con un impacto menor.
 *   4. Cuando todas las fechas quedan quietas, el cuchillo vuela en arco y se
 *      clava en HOY; tras un segundo comienza la salida a negro.
 *   5. onComplete de la timeline: salida a negro y arranque del home.
 *
 * El cuchillo vuela desde arriba a la derecha y se clava en la fecha de hoy
 * al aterrizar, usando el mismo impacto que remata su caida.
 *
 * Interaccion:
 *   Clic en cualquier parte del overlay, Escape o Space salta la
 *   introduccion y revela el home inmediatamente.
 *
 * ARQUITECTURA DOM:
 *   .calendar-ancla   — posicion final de la fecha (left/top % sobre el
 *                        contenedor del calendario) con translate(-50%,-50%)
 *                        para centrar la composicion sobre el punto.
 *                        Definido en CSS; GSAP NO lo toca.
 *   .calendar-card    — composicion de la fecha dentro del ancla. GSAP anima
 *                        SOLO su y durante la caida. Nada de x, left, top,
 *                        rotation ni scale.
 *   .calendar-content — contenido interior (numero + imagen), rotacion
 *                        estatica en CSS.
 *
 * En escritorio muestra seis fechas; en telefono, ayer, hoy y mañana.
 */
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { markBooted } from "../../lib/boot";
import { useMediaQuery } from "../../lib/use-media-query";
import {
  getCalendarDates,
  getDayNight,
  calendarAsset,
  NUMBER_ROTATION_BY_INDEX,
  type CalendarDate,
} from "../../lib/calendar";
import { CalendarCard } from "./CalendarCard";
import { CalendarKnife } from "./CalendarKnife";

/**
 * Marca a nivel de modulo para evitar que React 19 StrictMode vuelva a
 * mostrar el calendario despues de que ya se completo.
 */
let introCompleted = false;

/**
 * Duraciones de las transiciones del overlay (ms).
 * Se definen como constantes arriba del archivo para ajustarlas a mano.
 */
const FADE_OUT_MS = 1200; // overlay fade-out al entrar (opacity 1→0)
const FADE_IN_MS = 800; // overlay fade-in al salir (opacity 0→1)
const BLACK_HOLD_MS = 200; // pausa en negro entre calendario y home

/**
 * Constantes de la animacion de caida (ajustar a mano).
 */
const FALL_S = 0.55; // duracion de la caida de cada dia (s)
const START_ROT_DEG_MIN = 14; // rotacion inicial extra minima (grados)
const START_ROT_DEG_MAX = 28; // rotacion inicial extra maxima (grados)
const TODAY_DELAY_S = 0.24; // la onda del primer impacto desencadena la caida de hoy
const KNIFE_FLIGHT_S = 0.42;
const KNIFE_SETTLE_S = 0.08;
const KNIFE_HOLD_S = 1;
const KNIFE_LANDED_ROTATION = 315;

/**
 * POSICIONES FINALES (despues del desplazamiento hacia la izquierda):
 * Hoy en el centro (x=50%), ayer a su izquierda (x=28%).
 * Coordenadas porcentuales de referencia de Persona 5, adaptables al
 * viewport (no son pixeles hardcodeados).
 *   0 = hoy-2, 1 = hoy-1 (ayer), 2 = HOY, 3 = hoy+1, 4 = hoy+2,
 *   5 = hoy+3.
 */
const CARD_POSITIONS: Record<Breakpoint, { x: number; y: number }[]> = {
  desktop: [
    { x: 8, y: 42 }, // hoy-2
    { x: 28, y: 51 }, // ayer
    { x: 50, y: 61 }, // HOY
    { x: 67, y: 43 }, // hoy+1
    { x: 82, y: 32 }, // hoy+2
    { x: 93, y: 27 }, // hoy+3
  ],
  tablet: [
    { x: 12, y: 40 },
    { x: 30, y: 50 },
    { x: 50, y: 58 },
    { x: 67, y: 43 },
    { x: 82, y: 34 },
    { x: 94, y: 29 },
  ],
  mobile: [
    { x: 20, y: 49 },
    { x: 50, y: 60 },
    { x: 80, y: 49 },
  ],
};

/** Instantes clave de la timeline (segundos). */
const T = {
  bgStart: 0,
  datesStart: 0.55,
};

/** Tiempo maximo antes de forzar la salida aunque algo falle. */
const SAFETY_MS = 10000;

type Breakpoint = "desktop" | "tablet" | "mobile";

export function CalendarTransition() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const dates: CalendarDate[] = useMemo(() => getCalendarDates(), []);
  const breakpoint: Breakpoint = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";
  const visibleDates = useMemo(
    () =>
      (isMobile ? dates.slice(1, 4) : dates).map((date, visibleIndex) => ({
        date,
        sourceIndex: isMobile ? visibleIndex + 1 : visibleIndex,
        positionIndex: visibleIndex,
      })),
    [dates, isMobile],
  );
  const visibleIndices = useMemo(
    () => visibleDates.map(({ sourceIndex }) => sourceIndex),
    [visibleDates],
  );
  const dayNight = useMemo(() => getDayNight(), []);
  const bgSrc = useMemo(
    () =>
      calendarAsset(
        dayNight === "day" ? "calendar_day.webp" : "calendar_night.webp",
      ),
    [dayNight],
  );

  // ---------- Estado del overlay (unica capa reutilizada en ambas transiciones) ----------
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
  const knifeRef = useRef<HTMLImageElement>(null);
  const visualRefs = useRef<(HTMLDivElement | null)[]>(Array(6).fill(null));
  const contentRefs = useRef<(HTMLDivElement | null)[]>(Array(6).fill(null));

  const isMountedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const timelineCreatedRef = useRef(false);

  /** Bloquea el scroll mientras la introduccion esta activa. */
  const lockScroll = useCallback((lock: boolean) => {
    if (lock) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
  }, []);

  /**
   * Camino de finalizacion idempotente. Usado por:
   *   - Finalizacion normal de la secuencia de salida (onComplete de la timeline)
   *   - Clic / Escape / Space sobre el overlay (salto de introduccion)
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

  // Reduced motion: mostrar estado final inmediato, sin animacion.
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

  // Montaje: bloquear scroll y marcar que los componentes estan posicionados.
  useEffect(() => {
    if (reduced || hidden || introCompleted) return;
    lockScroll(true);
    setIsPositioned(true);
    return () => {
      lockScroll(false);
    };
  }, [reduced, hidden, lockScroll]);

  // ---------- Preload de imagenes con new Image() + onload / decode() ----------
  // El calendario no se muestra hasta que todas las imagenes esten cargadas.
  useEffect(() => {
    const sources: string[] = [
      calendarAsset("calendar_day.webp"),
      calendarAsset("calendar_night.webp"),
      calendarAsset("calendar_knife.png"),
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

  // ---------- ENTRADA: fade-out del overlay cuando las imagenes estan listas ----------
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
  }, [imagesLoaded, reduced, isPositioned]);

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

        // Pequeña pausa en negro, luego fade-out revelando el menu
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

  // ---------- Animacion de caida del calendario (GSAP timeline) ----------
  useEffect(() => {
    if (
      !showCalendar ||
      hidden ||
      reduced ||
      introCompleted ||
      !isPositioned ||
      !bgRef.current ||
      !containerRef.current ||
      !knifeRef.current ||
      visibleIndices.some((index) => visualRefs.current[index] === null) ||
      visibleIndices.some((index) => contentRefs.current[index] === null) ||
      timelineCreatedRef.current
    ) {
      return;
    }

    isMountedRef.current = true;
    timelineCreatedRef.current = true;

    // Temporizador de seguridad: nunca dejar la app bloqueada en el intro.
    // Se dispara aunque la animacion no haya podido montarse (por ejemplo,
    // en telefonos los índices de nodo visible y las refs renderizadas no
    // coinciden), para que el scroll de la pagina quede desbloqueado.
    safetyRef.current = setTimeout(() => {
      if (!finishedRef.current) {
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
      T.bgStart,
    );

    // Movimiento sutil de camara (ken burns lento)
    tl.to(
      bgRef.current,
      { scale: 1.05, duration: 4.0, ease: "sine.inOut" },
      T.bgStart + 0.4,
    );

    // ---------- Rotacion inicial: cada dia parte girado respecto a su rotacion final ----------
    const startRotByIndex: Record<number, number> = {};
    [0, 1, 3, 4, 5, 2].forEach((i) => {
      const sign = i % 2 === 0 ? 1 : -1;
      const spread =
        START_ROT_DEG_MIN +
        ((i % 6) / 5) * (START_ROT_DEG_MAX - START_ROT_DEG_MIN);
      startRotByIndex[i] = sign * spread;
    });

    const allWrappers = visualRefs.current.filter(
      (ref): ref is HTMLDivElement => ref !== null,
    );
    tl.set(allWrappers, { y: -(vh + 250), filter: "blur(3px)" }, 0);

    [0, 1, 3, 4, 5, 2].forEach((i) => {
      const content = contentRefs.current[i];
      if (!content) return;
      const rotFinal = NUMBER_ROTATION_BY_INDEX[i];
      tl.set(
        content,
        {
          rotation: rotFinal + startRotByIndex[i],
          transformOrigin: "50% 50%",
        },
        0,
      );
    });

    const fallStart = T.datesStart;
    const otherIndices = isMobile ? [1, 3] : [0, 1, 3, 4, 5];
    const impactTime = fallStart + FALL_S;

    otherIndices.forEach((i) => {
      const wrapper = visualRefs.current[i];
      const content = contentRefs.current[i];
      if (!wrapper || !content) return;

      tl.fromTo(
        wrapper,
        { y: -(vh + 250), filter: "blur(3px)" },
        {
          y: 0,
          filter: "blur(0px)",
          duration: FALL_S,
          ease: "power4.in",
        },
        fallStart,
      );

      tl.to(
        content,
        {
          rotation: NUMBER_ROTATION_BY_INDEX[i],
          transformOrigin: "50% 50%",
          duration: FALL_S,
          ease: "power4.in",
        },
        fallStart,
      );
    });

    otherIndices.forEach((i) => {
      const wrapper = visualRefs.current[i];
      const content = contentRefs.current[i];
      if (!wrapper || !content) return;
      const rotFinal = NUMBER_ROTATION_BY_INDEX[i];

      tl.to(
        wrapper,
        {
          scaleY: 0.91,
          transformOrigin: "50% 100%",
          duration: 0.055,
          ease: "power4.in",
        },
        impactTime,
      );
      tl.to(
        wrapper,
        {
          scaleY: 1.018,
          duration: 0.09,
          ease: "power2.out",
        },
        impactTime + 0.055,
      );
      tl.to(
        wrapper,
        {
          scaleY: 1,
          duration: 0.17,
          ease: "power2.out",
        },
        impactTime + 0.145,
      );
      tl.to(
        wrapper,
        { y: -6, duration: 0.085, ease: "power2.out" },
        impactTime,
      );
      tl.to(
        wrapper,
        { y: 0, duration: 0.18, ease: "power3.out" },
        impactTime + 0.085,
      );

      tl.to(
        content,
        {
          keyframes: [
            {
              rotation: rotFinal + 0.65,
              y: -1.2,
              duration: 0.07,
              ease: "power2.in",
            },
            {
              rotation: rotFinal - 0.35,
              y: 0.5,
              duration: 0.1,
              ease: "power2.inOut",
            },
            { rotation: rotFinal, y: 0, duration: 0.15, ease: "power2.out" },
          ],
        },
        impactTime,
      );
    });

    // Onda de impacto comun: vertical, breve y amortiguada; sin flash ni vibracion lateral.
    const impactWave = {
      keyframes: [
        { y: 2.6, duration: 0.07, ease: "power4.in" },
        { y: -1.4, duration: 0.11, ease: "power2.out" },
        { y: 0.45, duration: 0.12, ease: "power2.inOut" },
        { y: 0, duration: 0.16, ease: "power2.out" },
      ],
    };
    tl.to(bgRef.current, impactWave, impactTime);
    tl.to(
      containerRef.current,
      {
        ...impactWave,
        keyframes: impactWave.keyframes.map((frame) => ({
          ...frame,
          y: Number(frame.y) * 0.72,
        })),
      },
      impactTime,
    );

    const hoyIndex = 2;
    const hoyWrapper = visualRefs.current[hoyIndex];
    const hoyContent = contentRefs.current[hoyIndex];
    const knife = knifeRef.current;
    const hoyTime = impactTime + TODAY_DELAY_S;
    const hoyLandTime = hoyTime + FALL_S;

    if (hoyWrapper && hoyContent && knife) {
      const hoyRotFinal = NUMBER_ROTATION_BY_INDEX[hoyIndex];
      const rootRect = rootRef.current?.getBoundingClientRect();
      const number = hoyContent.querySelector<HTMLElement>(
        ".calendar-date-number",
      );
      const numberRect = number?.getBoundingClientRect();
      const knifeRect = knife.getBoundingClientRect();

      if (rootRect && numberRect) {
        const wrapperY = Number(gsap.getProperty(hoyWrapper, "y")) || 0;
        const targetX =
          numberRect.left + numberRect.width * 0.54 - rootRect.left;
        const targetY =
          numberRect.top + numberRect.height * 0.46 - rootRect.top - wrapperY;
        const originX = knifeRect.width * 0.03;
        const originY = knifeRect.height * 0.5;
        const targetLeft = targetX - originX;
        const targetTop = targetY - originY;
        const knifeStartTime = hoyLandTime + 0.28;
        const startX = targetX + Math.min(rootRect.width * 0.4, 560);
        const startY = targetY - Math.min(rootRect.height * 0.34, 260);

        tl.set(
          knife,
          {
            x: startX - originX,
            y: startY - originY,
            rotation: KNIFE_LANDED_ROTATION - 180,
            transformOrigin: "3% 50%",
            autoAlpha: 0,
          },
          0,
        );
        tl.set(knife, { autoAlpha: 1 }, knifeStartTime);
        tl.to(
          knife,
          {
            x: targetLeft,
            y: targetTop,
            duration: KNIFE_FLIGHT_S,
            ease: "power2.in",
          },
          knifeStartTime,
        );
        tl.to(
          knife,
          {
            rotation: KNIFE_LANDED_ROTATION,
            duration: KNIFE_FLIGHT_S,
            ease: "none",
          },
          knifeStartTime,
        );
        tl.to(
          knife,
          {
            x: targetLeft - 4,
            y: targetTop + 4,
            rotation: KNIFE_LANDED_ROTATION + 4,
            duration: 0.055,
            ease: "power4.in",
          },
          knifeStartTime + KNIFE_FLIGHT_S,
        );
        tl.to(
          knife,
          {
            x: targetLeft - 1,
            y: targetTop + 1,
            rotation: KNIFE_LANDED_ROTATION,
            duration: KNIFE_SETTLE_S,
            ease: "power2.out",
          },
          knifeStartTime + KNIFE_FLIGHT_S + 0.055,
        );

        tl.to(
          {},
          {
            duration: KNIFE_HOLD_S,
            onComplete: startExit,
          },
          knifeStartTime + KNIFE_FLIGHT_S + 0.055 + KNIFE_SETTLE_S,
        );
      }

      tl.fromTo(
        hoyWrapper,
        { y: -(vh + 250), filter: "blur(3px)" },
        { y: 0, filter: "blur(0px)", duration: FALL_S, ease: "power4.in" },
        hoyTime,
      );

      tl.to(
        hoyContent,
        {
          rotation: hoyRotFinal,
          transformOrigin: "50% 50%",
          duration: FALL_S,
          ease: "power4.in",
        },
        hoyTime,
      );

      tl.to(
        hoyWrapper,
        {
          scaleY: 0.95,
          transformOrigin: "50% 100%",
          duration: 0.055,
          ease: "power4.in",
        },
        hoyLandTime,
      );
      tl.to(
        hoyWrapper,
        { scaleY: 1.012, duration: 0.09, ease: "power2.out" },
        hoyLandTime + 0.055,
      );
      tl.to(
        hoyWrapper,
        { scaleY: 1, duration: 0.15, ease: "power2.out" },
        hoyLandTime + 0.145,
      );
      tl.to(
        hoyWrapper,
        { y: -4, duration: 0.08, ease: "power2.out" },
        hoyLandTime,
      );
      tl.to(
        hoyWrapper,
        { y: 0, duration: 0.17, ease: "power3.out" },
        hoyLandTime + 0.08,
      );

      tl.to(
        hoyContent,
        {
          keyframes: [
            {
              rotation: hoyRotFinal + 0.45,
              y: -0.8,
              duration: 0.07,
              ease: "power2.in",
            },
            {
              rotation: hoyRotFinal - 0.25,
              y: 0.3,
              duration: 0.1,
              ease: "power2.inOut",
            },
            { rotation: hoyRotFinal, y: 0, duration: 0.14, ease: "power2.out" },
          ],
        },
        hoyLandTime,
      );

      otherIndices.forEach((i) => {
        const content = contentRefs.current[i];
        if (!content) return;
        const rotFinal = NUMBER_ROTATION_BY_INDEX[i];
        tl.to(
          content,
          {
            keyframes: [
              {
                rotation: rotFinal + 0.2,
                y: -0.4,
                duration: 0.08,
                ease: "power2.in",
              },
              { rotation: rotFinal, y: 0, duration: 0.16, ease: "power2.out" },
            ],
          },
          hoyLandTime,
        );
      });

      const hoyRipple = {
        keyframes: [
          { y: 1.1, duration: 0.07, ease: "power3.in" },
          { y: -0.45, duration: 0.1, ease: "power2.out" },
          { y: 0, duration: 0.14, ease: "power2.out" },
        ],
      };
      tl.to(bgRef.current, hoyRipple, hoyLandTime);
      tl.to(
        containerRef.current,
        {
          ...hoyRipple,
          keyframes: hoyRipple.keyframes.map((frame) => ({
            ...frame,
            y: Number(frame.y) * 0.65,
          })),
        },
        hoyLandTime,
      );
    }

    return () => {
      isMountedRef.current = false;
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      tlRef.current = null;
    };
  }, [
    showCalendar,
    hidden,
    reduced,
    isPositioned,
    breakpoint,
    isMobile,
    visibleIndices,
    startExit,
    finish,
  ]);

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
      {/* Overlay negro — capa unica reutilizada en ambas transiciones.
          Arranca con opacity:1 (montado desde el primer render).
          pointer-events:none cuando esta a opacity 0. */}
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
          {/* Fondo ciudad — dia o noche segun hora local */}
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
            {visibleDates.map(({ date, sourceIndex, positionIndex }) => {
              const pos = CARD_POSITIONS[breakpoint][positionIndex];
              return (
                <div
                  key={sourceIndex}
                  className="calendar-ancla"
                  style={
                    {
                      position: "absolute",
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: "translate(-50%, -50%)",
                    } as React.CSSProperties
                  }
                >
                  <CalendarCard
                    date={date}
                    index={sourceIndex}
                    wrapperRef={(el: HTMLDivElement | null) => {
                      visualRefs.current[sourceIndex] = el;
                    }}
                    contentRef={(el: HTMLDivElement | null) => {
                      contentRefs.current[sourceIndex] = el;
                    }}
                  />
                </div>
              );
            })}
          </div>
          <CalendarKnife ref={knifeRef} />
        </>
      )}
    </div>
  );
}

CalendarTransition.displayName = "CalendarTransition";
