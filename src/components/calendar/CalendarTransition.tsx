/**
 * Pantalla de introducción tipo Persona 5 — transición de calendario.
 *
 * Sustituye a LoadScreen como única pantalla de arranque. Reutiliza la
 * arquitectura de arranque existente (boot.ts, markBooted/useBooted) para
 * que el ciclo de vida del home y el resto de la aplicación quede intacto.
 *
 * Coreografía (GSAP, una sola timeline coordinada):
 *   ACT 1 — La ciudad: fondo día/noche establece la escena.
 *   ACT 2 — Ayer cae primero al centro con peso físico (impacto, rebote).
 *   ACT 3 — Las fechas restantes caen a sus posiciones, escalonado.
 *   ACT 4 — El calendario se desplaza hacia la izquierda como un grupo:
 *           hoy queda centrado, ayer a su alrededor (≈28%).
 *   ACT 6 — Pausa y transición al portfolio: markBooted() revela el home.
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
import { useBootAssets } from "../../lib/load-progress";
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

/** Duración de la pausa (segundos) entre que la última fecha termina de
 * asentarse y que comienza el desplazamiento horizontal del calendario.
 */
const PAUSE_BEFORE_SHIFT_S = 1.0;

/**
 * Tiempo de espera tras el desplazamiento antes de marcar el arranque como
 * completado y revelar el home.
 */
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

  /** Assetos a precargar antes de iniciar la animación. */
  const bootSources = useMemo(
    () =>
      [
        calendarAsset("calendar_day.png"),
        calendarAsset("calendar_night.png"),
        ...dates.map((d) => calendarAsset(d.weekdayFile)),
      ] as readonly string[],
    [dates]
  );
  const assets = useBootAssets(bootSources);

  const [hidden, setHidden] = useState(introCompleted);
  const [isPositioned, setIsPositioned] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));

  /** Marca si el componente sigue montado (evita callbacks tras unmount). */
  const isMountedRef = useRef(false);
  /** Referencia a la timeline activa para poder matarla en cleanup. */
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  /** ID del temporizador de seguridad. */
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Indica si la secuencia ya terminó (idempotencia). */
  const finishedRef = useRef(false);
  /** Evita que la timeline GSAP se cree más de una vez (StrictMode, re-renders, etc.). */
  const timelineCreatedRef = useRef(false);

  /** Resolución del breakpoint activo para elegir posiciones y tamaños. */
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
   *   - Finalización normal de la timeline (onComplete)
   *   - Clic / Escape / Space sobre el overlay
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

    setHidden(true);
    markBooted();
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

  // Lanzar la timeline GSAP cuando todo esté listo.
  useEffect(() => {
    if (
      hidden ||
      reduced ||
      introCompleted ||
      !assets.ready ||
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

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tlRef.current = tl;

      // ---------- ACT 1 — LA CIUDAD ----------
      tl.fromTo(
        bgRef.current,
        { scale: 1.25, autoAlpha: 0.25 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 1.4,
          ease: "power3.out",
        },
        T.bgStart
      );

      // Movimiento sutil de cámara (ken burns lento)
      tl.to(
        bgRef.current,
        { scale: 1.05, duration: 4.0, ease: "sine.inOut" },
        T.bgStart + 0.4
      );

      // ---------- ACT 2 — HOY CAE PRIMERO ----------
      // Hoy (índice 2) es la primera fecha en caer y aterrizar en el centro,
      // con su caída completa (impacto, rebote y asentamiento) antes de que
      // ninguna otra fecha empiece a moverse.
      // ---------- ACT 2 — LAS FECHAS QUE NO SON HOY CAEN PRIMERO ----------
      // Los seis índices que no son hoy caen todos a la vez, sin
      // desplazamiento lateral, directamente a su posición final.
      const fallDuration = 0.4;
      const otherIndices = [0, 1, 3, 4, 5, 6];
      otherIndices.forEach((i) => {
        const ref = visualRefs.current[i];
        if (!ref) return;
        const pos = positions[i];

        // Fase 1: caída acelerada desde arriba (gravedad real).
        tl.fromTo(
          ref,
          {
            x: 0,
            y: -750,
            scale: 0.15,
            rotation: -7,
            autoAlpha: 0,
          },
          {
            x: 0,
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

        // Fase 2: impacto — compresión vertical + expansión horizontal
        tl.to(
          ref,
          { scaleY: 0.75, scaleX: 1.2, duration: 0.09, ease: "power2.in" },
          T.datesStart + fallDuration
        );

        // Fase 3: rebote — expansión vertical + compresión horizontal
        tl.to(
          ref,
          { scaleY: 1.08, scaleX: 0.92, duration: 0.14, ease: "power2.out" },
          T.datesStart + fallDuration + 0.09
        );

        // Fase 4: asentamiento final
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

      // Marca: las fechas que no son hoy han terminado de asentarse
      tl.add("otherDatesLanded");

      // ---------- ACT 3 — HOY CAE ÚLTIMO ----------
      // Hoy cae después de que las otras seis fechas hayan aterrizado,
      // directamente en el centro (x: 0 respecto al ancla).
      const hoyIndex = 2;
      const hoyRef = visualRefs.current[hoyIndex];
      const hoyFallDuration = 0.3;
      const hoyPos = positions[hoyIndex];

      if (hoyRef) {
        // Fase 1: caída acelerada desde arriba (gravedad real).
        tl.fromTo(
          hoyRef,
          {
            x: 0,
            y: -750,
            scale: 0.15,
            rotation: -14,
            autoAlpha: 0,
          },
          {
            x: 0,
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

        // Fase 2: impacto — compresión vertical + expansión horizontal
        tl.to(
          hoyRef,
          { scaleY: 0.75, scaleX: 1.2, duration: 0.09, ease: "power2.in" },
          T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration
        );

        // Fase 3: rebote — expansión vertical + compresión horizontal
        tl.to(
          hoyRef,
          { scaleY: 1.08, scaleX: 0.92, duration: 0.14, ease: "power2.out" },
          T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration + 0.09
        );

        // Fase 4: asentamiento final
        tl.to(
          hoyRef,
          { scaleY: hoyPos.scale, scaleX: hoyPos.scale, duration: 0.16, ease: "power2.out" },
          T.datesStart + fallDuration + 0.09 + 0.14 + 0.16 + hoyFallDuration + 0.09 + 0.14
        );
      }

      // Marca: hoy ha terminado de aterrizar y asentarse
      tl.add("hoyLanded");

      // Marca: todas las fechas han aterrizado y se han asentado.
      // El desplazamiento y la pausa se posicionan respecto a este instante
      // real, no a un timestamp hardcodeado.
      tl.add("allDatesLanded");

      // ---------- PAUSA DE 1 SEGUNDO ----------
      // El calendario permanece completamente quieto durante exactamente
      // PAUSE_BEFORE_SHIFT_S segundos tras el último aterrizaje.
      tl.add("calendarShift", "+=" + PAUSE_BEFORE_SHIFT_S);

      // ---------- ACT 4 — EL CALENDARIO SE DESPLAZA HACIA LA IZQUIERDA ----------
      // Todas las fechas se mueven hacia la izquierda como un grupo unificado
      // (sin animación independiente ni stagger). Cada visual vuelve a x: 0,
      // es decir, a su ancla final. Hoy pasa de 72% a 50% (centro) y ayer
      // de 50% a 28%; se preservan espaciamiento, tamaños y verticales.
      tl.to(
        visualRefs.current.filter((ref): ref is HTMLDivElement => ref !== null),
        {
          x: 0,
          duration: 1.0,
          ease: "power2.inOut",
        },
        "calendarShift"
      );

      // ---------- ACT 6 — TRANSICIÓN AL PORTFOLIO ----------
      // Tras el desplazamiento (1.0 s), una breve retención antes de revelar
      // el home. Se añade al final de la timeline, así empieza justo cuando
      // termina el shift.
      tl.to({}, { duration: HOLD_AFTER_SHIFT_S, onComplete: finish });

    return () => {
      isMountedRef.current = false;
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      tlRef.current = null;
      // No reseteamos timelineCreatedRef ni hacemos ctx.revert() aquí:
      // así la timeline GSAP solo existe una vez y no se deshace ante
      // re-renders o StrictMode.
    };
  }, [hidden, reduced, assets.ready, isPositioned, breakpoint]);

  if (hidden) return null;

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

      {/* Overlay de clic para saltar la introducción */}
      <div
        className="fixed inset-0 z-[30] cursor-pointer pointer-events-auto"
        onPointerDown={finish}
      />
    </div>
  );
}
