/**
 * Pantalla de introducción tipo Persona 5 — transición de calendario.
 *
 * Sustituye a LoadScreen como única pantalla de arranque. Reutiliza la
 * arquitectura de arranque existente (boot.ts, markBooted/useBooted) para
 * que el ciclo de vida del home y el resto de la aplicación quede intacto.
 *
 * Coreografía (GSAP, una sola timeline):
 *   ACT 1 — La ciudad: fondo día/nombre establece la escena.
 *   ACT 2 — Ayer cae primero al centro con peso físico.
 *   ACT 3 — Las fechas restantes caen a sus posiciones.
 *   ACT 4 — El calendario se desplaza hacia la izquierda: hoy queda centrado.
 *   ACT 5 — El cuchillo impacta sobre hoy.
 *   ACT 6 — Pausa y transición al portfolio: markBooted() revela el home.
 *
 * Interacción:
 *   Clic en cualquier parte del overlay, Escape o Space salta la
 *   introducción y revela el home inmediatamente.
 *
 * ESTRUCTURA DOM:
 *   .calendar-card-wrapper — position: absolute; left: 0%; top: 0%;
 *   GSAP es el único propietario de x/y/xPercent/yPercent/scale/rotation.
 *   El número y el PNG del weekday son hijas directas del card,
 *   por lo que caen, rebotan y se comprimen como una sola unidad.
 *   El cuchillo vive dentro de su propio contenedor absoluto, posicionado
 *   por GSAP con x/y en píxeles y xPercent/yPercent para centrado.
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
import { CalendarKnife } from "./CalendarKnife";

/**
 * Marca a nivel de módulo para evitar que React 19 StrictMode vuelva a
 * mostrar el calendario después de que ya se completó.
 */
let introCompleted = false;

/**
 * POSICIONES FINALES (después del desplazamiento hacia la izquierda):
 * Hoy en el centro (x=50%), ayer a su izquierda (x=28%).
 * Coordenadas tomadas de la referencia de Persona 5.
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

/**
 * POSICIONES INICIALES (antes del desplazamiento):
 * Ayer (hoy-1) en el centro (x=50%). Todo lo demás se desplaza a la
 * derecha por 22 puntos porcentuales para que hoy quede a la derecha
 * de ayer. Después del shift hacia la izquierda, hoy queda en el centro.
 */
const INITIAL_CARD_POSITIONS: Record<string, { x: number; y: number; scale: number }[]> = {
  desktop: [
    { x: 30, y: 46, scale: 0.60 },   // hoy-2 (8% + 22%)
    { x: 50, y: 55, scale: 0.75 },   // ayer (28% + 22%) ← CENTRO INICIAL
    { x: 72, y: 59, scale: 1.00 },   // hoy (50% + 22%)
    { x: 86, y: 47, scale: 0.75 },   // hoy+1 (64% + 22%)
    { x: 100, y: 37, scale: 0.60 },  // hoy+2 (78% + 22%)
    { x: 113, y: 36, scale: 0.45 },  // hoy+3 (91% + 22%)
    { x: 126, y: 46, scale: 0.45 },  // hoy+4 (104% + 22%)
  ],
  tablet: [
    { x: 34, y: 44, scale: 0.50 },   // 12% + 22%
    { x: 52, y: 52, scale: 0.65 },   // 30% + 22% ← CENTRO INICIAL
    { x: 72, y: 56, scale: 1.00 },   // 50% + 22%
    { x: 88, y: 46, scale: 0.65 },   // 66% + 22%
    { x: 102, y: 40, scale: 0.50 },  // 80% + 22%
    { x: 112, y: 38, scale: 0.38 },  // 90% + 22%
    { x: 122, y: 44, scale: 0.38 },  // 100% + 22%
  ],
  mobile: [
    { x: 40, y: 42, scale: 0.42 },   // 18% + 22%
    { x: 56, y: 48, scale: 0.55 },   // 34% + 22% ← CENTRO INICIAL
    { x: 72, y: 52, scale: 1.00 },   // 50% + 22%
    { x: 88, y: 44, scale: 0.55 },   // 66% + 22%
    { x: 104, y: 40, scale: 0.42 },  // 82% + 22%
    { x: 112, y: 38, scale: 0.32 },  // 90% + 22%
    { x: 122, y: 42, scale: 0.32 },  // 100% + 22%
  ],
};

/** Índice de la fecha que empieza en el centro (ayer = hoy-1). */
const INITIAL_CENTER_INDEX = 1;

/** Índice de la fecha activa (hoy). */
const TODAY_INDEX = 2;

/** Instantes clave de la timeline (segundos). */
const T = {
  bgStart: 0,
  datesStart: 0.55,
  shiftStart: 2.6,
  knifeStart: 4.0,
  impactStart: 4.5,
  holdStart: 5.0,
  boot: 5.6,
};

/** Tiempo máximo antes de forzar la salida aunque algo falle. */
const SAFETY_MS = 10000;

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
        calendarAsset("calendar_knife.png"),
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));
  const knifeRef = useRef<HTMLImageElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  /** Marca si el componente sigue montado (evita callbacks tras unmount). */
  const isMountedRef = useRef(false);
  /** Referencia a la timeline activa para poder matarla en cleanup. */
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  /** ID del temporizador de seguridad. */
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Indica si la secuencia ya terminó (idempotencia). */
  const finishedRef = useRef(false);

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
      !knifeRef.current ||
      !flashRef.current ||
      cardRefs.current.some((ref) => ref === null)
    ) {
      return;
    }

    isMountedRef.current = true;

    // Temporizador de seguridad: nunca dejar la app bloqueada en el intro.
    safetyRef.current = setTimeout(() => {
      if (isMountedRef.current && !finishedRef.current) {
        finish();
      }
    }, SAFETY_MS);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tlRef.current = tl;

      // Dimensiones del viewport para convertir % a píxeles
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const px = (pct: number) => vw * (pct / 100);
      const py = (pct: number) => vh * (pct / 100);

      const positions = CARD_POSITIONS.desktop;

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

      // ---------- ACT 2 & 3 — LAS FECHAS CAEN CON PESO FÍSICO ----------
      // Ayer (índice 1) cae primero al centro. Las demás siguen escalonado.
      cardRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const isFirst = i === INITIAL_CENTER_INDEX;
        const fallDuration = isFirst ? 1.15 : 0.95;
        const start = T.datesStart + (isFirst ? 0 : i * 0.12);
        const pos = INITIAL_CARD_POSITIONS.desktop[i];

        // Fase 1: caída acelerada desde arriba (gravedad real)
        tl.fromTo(
          ref,
          {
            x: px(pos.x),
            y: -750,
            scale: 0.15,
            rotation: isFirst ? -14 : -7,
            xPercent: -50,
            yPercent: -50,
            autoAlpha: 0,
          },
          {
            x: px(pos.x),
            y: py(pos.y),
            scale: pos.scale,
            rotation: 0,
            autoAlpha: 1,
            duration: fallDuration,
            ease: "power4.in",
            clearProps: "rotation,xPercent,yPercent",
          },
          start
        );

        // Fase 2: impacto — compresión vertical + expansión horizontal
        tl.to(
          ref,
          {
            scaleY: 0.75,
            scaleX: 1.2,
            duration: 0.09,
            ease: "power2.in",
          },
          start + fallDuration
        );

        // Fase 3: rebote — expansión vertical + compresión horizontal
        tl.to(
          ref,
          {
            scaleY: 1.08,
            scaleX: 0.92,
            duration: 0.14,
            ease: "power2.out",
          },
          start + fallDuration + 0.09
        );

        // Fase 4: asentamiento final
        tl.to(
          ref,
          {
            scaleY: pos.scale,
            scaleX: pos.scale,
            duration: 0.16,
            ease: "power2.out",
          },
          start + fallDuration + 0.09 + 0.14
        );
      });

      // Sacudida de pantalla sincronizada con el primer impacto (ayer)
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
        T.datesStart + 1.15
      );

      // ---------- ACT 4 — EL CALENDARIO SE DESPLAZA HACIA LA IZQUIERDA ----------
      // Todas las fechas se mueven hacia la izquierda una posición.
      // Hoy (índice 2) pasa de x=72% a x=50% (centro).
      // Ayer (índice 1) pasa de x=50% a x=28% (izquierda del centro).
      tl.to(
        cardRefs.current.filter((ref): ref is HTMLDivElement => ref !== null),
        {
          x: (_, i) => px(positions[i].x),
          y: (_, i) => py(positions[i].y),
          xPercent: -50,
          yPercent: -50,
          duration: 1.0,
          ease: "power2.inOut",
          stagger: 0.07,
        },
        T.shiftStart
      );

      // ---------- ACT 5 — EL CUCHILLO ----------
      // El PNG es horizontal: hoja a la izquierda, mango a la derecha.
      // Se rota 45° en sentido horario para que la hoja apunte
      // hacia abajo-izquierda (en diagonal sobre hoy).
      // Aproxima desde la parte superior derecha, sobre hoy (índice 2).
      const todayPos = positions[TODAY_INDEX];
      const todayX = px(todayPos.x);
      const todayY = py(todayPos.y);

      tl.fromTo(
        knifeRef.current,
        {
          x: todayX + 340,
          y: todayY - 420,
          xPercent: -50,
          yPercent: -50,
          rotation: 0,
          scale: 1.8,
          autoAlpha: 0,
        },
        {
          x: todayX,
          y: todayY,
          xPercent: -50,
          yPercent: -50,
          rotation: 45,
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          ease: "power3.in",
        },
        T.knifeStart
      );

      // Sacudida de pantalla con el impacto del cuchillo
      tl.to(
        containerRef.current,
        {
          x: () => (Math.random() > 0.5 ? 14 : -14),
          y: () => (Math.random() > 0.5 ? 12 : -12),
          duration: 0.025,
          repeat: 12,
          yoyo: true,
          ease: "none",
        },
        T.impactStart
      );

      // Compresión de hoy al impacto del cuchillo
      tl.to(
        cardRefs.current[TODAY_INDEX],
        {
          scaleY: 0.8,
          duration: 0.07,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        },
        T.impactStart
      );

      // Destello de impacto breve y contenido
      tl.fromTo(
        flashRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 0.35, duration: 0.05, yoyo: true, repeat: 1 },
        T.impactStart + 0.02
      );

      // ---------- ACT 6 — PAUSA Y TRANSICIÓN AL PORTFOLIO ----------
      tl.to({}, { duration: 0.5, onComplete: finish }, T.holdStart);
    }, rootRef);

    return () => {
      isMountedRef.current = false;
      if (safetyRef.current) {
        clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      tlRef.current = null;
      ctx.revert();
    };
  }, [hidden, reduced, assets.ready, isPositioned, lockScroll, finish]);

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

      {/* Destello de impacto (capa superior) */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* Contenedor del calendario, centrado en pantalla */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {dates.map((date, index) => {
          return (
            <div
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="calendar-card-wrapper"
              data-index={String(index)}
              style={{
                left: "0%",
                top: "0%",
              } as React.CSSProperties}
            >
              <CalendarCard date={date} index={index} />
            </div>
          );
        })}
      </div>

      {/* Cuchillo: posicionado sobre hoy (índice 2) */}
      <div
        ref={knifeRef}
        className="absolute pointer-events-none"
        style={{
          left: "0%",
          top: "0%",
          zIndex: 20,
        }}
      >
        <CalendarKnife ref={knifeRef} />
      </div>

      {/* Overlay de clic para saltar la introducción */}
      <div
        className="fixed inset-0 z-[30] cursor-pointer pointer-events-auto"
        onPointerDown={finish}
      />
    </div>
  );
}
