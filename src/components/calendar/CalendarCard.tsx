/**
 * Tarjeta individual de fecha del calendario tipo Persona 5.
 *
 * Cada composición es un lockup vertical indivisible:
 *   - Wrapper exterior (position:absolute, se anima SOLO en y durante la caída).
 *   - Contenido interior (número + PNG del día de la semana): rotación ESTÁTICA
 *     en CSS, nunca se anima su rotación/x/scale/transformOrigin durante la caída.
 *
 * El número usa dos capas position:absolute superpuestas con fuente p5hatty:
 *   - Capa trasera (z-index:1): texto blanco con -webkit-text-stroke blanco grueso
 *     (0.24em) que crea un halo BLANCO PURO ancho.
 *   - Capa delantera (z-index:2): mismo texto en color según el día, con stroke fino
 *     (0.03em) del mismo color.
 * La imagen del día de la semana va DELANTE (z-index:3), empezando en el 85% de la
 * altura del número (tapa su ~20% inferior).
 *
 * La sombra negra (drop-shadow) se aplica sobre el contenedor de las capas del
 * número, NO sobre el texto blanco.
 *
 * El color de relleno del número depende EXCLUSIVAMENTE del día de la semana:
 *   Lunes a Viernes: #111 (casi negro)
 *   Sábado: #4fb3f0 (azul claro)
 *   Domingo: #e8112d (rojo)
 *
 * La rotación del número y de la imagen es diferente por cada día.
 */
import { forwardRef, type Ref } from "react";
import type { CalendarDate } from "../../lib/calendar";
import { calendarAsset } from "../../lib/calendar";
import { useMediaQuery } from "../../lib/use-media-query";

interface CalendarCardProps {
  date: CalendarDate;
  /** Índice dentro del array de siete fechas (0-6). */
  index: number;
  /** Ref al wrapper exterior (el único elemento que se anima en y durante la caída). */
  wrapperRef?: Ref<HTMLDivElement>;
  /** Ref al contenido interior (número + imagen, rotación estática). */
  contentRef?: Ref<HTMLDivElement>;
}

/** Asigna una ref de forma segura (acepta callback o RefObject). */
function assignRef<T>(ref: Ref<T> | undefined, instance: T | null): void {
  if (typeof ref === "function") {
    (ref as (instance: T | null) => void)(instance);
  } else if (ref) {
    (ref as React.RefObject<T | null>).current = instance;
  }
}

/** Color de relleno del número según el día de la semana (índice JS: 0=Dom…6=Sáb). */
const NUMBER_FILL_BY_WEEKDAY: Record<number, string> = {
  0: "#e8112d", // domingo → rojo
  1: "#111111", // lunes → casi negro
  2: "#111111", // martes → casi negro
  3: "#111111", // miércoles → casi negro
  4: "#111111", // jueves → casi negro
  5: "#111111", // viernes → casi negro
  6: "#4fb3f0", // sábado → azul claro
};

/** Tamaño de fuente del número (px) — visualmente dominante. */
const NUMBER_FONT_SIZE_BY_INDEX: Record<number, number> = {
  0: 105, // hoy-2
  1: 140, // ayer
  2: 200, // HOY — el número más grande de la pantalla
  3: 140, // hoy+1
  4: 105, // hoy+2
  5: 80,  // hoy+3
  6: 80,  // hoy+4 (buffer)
};

/** Rotación del número por índice (grados). Cada día tiene un ángulo distinto. */
export const NUMBER_ROTATION_BY_INDEX: Record<number, number> = {
  0: -5, // hoy-2
  1: -3, // ayer
  2: -4, // HOY
  3: -2, // hoy+1
  4: -1, // hoy+2
  5: -3, // hoy+3
  6: -2, // hoy+4
};

/** Rotación de la imagen del día por índice (grados). Cada día tiene un ángulo distinto. */
const WEEKDAY_ROTATION_BY_INDEX: Record<number, number> = {
  0: 3, // hoy-2
  1: 2, // ayer
  2: 1, // HOY
  3: 3, // hoy+1
  4: 2, // hoy+2
  5: 1, // hoy+3
  6: 0, // hoy+4
};

/** Ancho de cada composición (px) — el número domina visualmente. */
const CARD_WIDTH_BY_INDEX: Record<number, number> = {
  0: 130, // hoy-2
  1: 170, // ayer
  2: 280, // HOY (activo, el más grande)
  3: 170, // hoy+1
  4: 130, // hoy+2
  5: 110, // hoy+3
  6: 110, // hoy+4 (buffer)
};

const CalendarCard = forwardRef<HTMLDivElement, CalendarCardProps>((props, forwardedRef) => {
  const { date, index, wrapperRef, contentRef } = props;

  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 639px)");
  const widthScale = isMobile ? 0.45 : isTablet ? 0.8 : 1;

  const width = CARD_WIDTH_BY_INDEX[index] * widthScale;
  const fontSize = NUMBER_FONT_SIZE_BY_INDEX[index] * widthScale;
  const src = calendarAsset(date.weekdayFile);
  const numberFill = NUMBER_FILL_BY_WEEKDAY[date.weekday];
  const numberRotation = NUMBER_ROTATION_BY_INDEX[index];
  const weekdayRotation = WEEKDAY_ROTATION_BY_INDEX[index];

  // Grosor del contorno proporcional al tamaño del número (en em).
  const backStrokeEm = 0.24;
  const frontStrokeEm = 0.03;

  // La imagen empieza en el 85% de la altura del número (tapa su ~20% inferior).
  const weekdayTopPx = fontSize * 0.85;

  const handleWrapperRef = (el: HTMLDivElement | null) => {
    assignRef(wrapperRef, el);
    assignRef(forwardedRef, el);
  };

  // Capa trasera: halo blanco ancho (z-index:1)
  const backStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    textAlign: "center",
    fontFamily: "'p5hatty', sans-serif",
    fontWeight: "400",
    fontSize: `${fontSize}px`,
    color: "#fff",
    WebkitTextFillColor: "#fff",
    WebkitTextStroke: `${backStrokeEm}em #fff`,
    paintOrder: "stroke fill",
    filter: "drop-shadow(4px 4px 0 #000)",
    transform: `rotate(${numberRotation}deg)`,
    zIndex: 1,
    whiteSpace: "nowrap",
    letterSpacing: "-0.03em",
  };

  // Capa delantera: relleno de color según el día (z-index:2)
  const frontStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    textAlign: "center",
    fontFamily: "'p5hatty', sans-serif",
    fontWeight: "400",
    fontSize: `${fontSize}px`,
    color: numberFill,
    WebkitTextFillColor: numberFill,
    WebkitTextStroke: `${frontStrokeEm}em ${numberFill}`,
    paintOrder: "stroke fill",
    transform: `rotate(${numberRotation}deg)`,
    zIndex: 2,
    whiteSpace: "nowrap",
    letterSpacing: "-0.03em",
  };

  // Imagen del día de la semana: DELANTE de ambas capas (z-index:3)
  const weekdayStyle: React.CSSProperties = {
    position: "absolute",
    top: `${weekdayTopPx}px`,
    left: 0,
    width: "100%",
    height: "auto",
    transform: `rotate(${weekdayRotation}deg)`,
    zIndex: 3,
  };

  return (
    <div
      className="calendar-card pointer-events-none"
      ref={handleWrapperRef}
      style={{
        position: "relative",
        width: `${width}px`,
        height: "auto",
      }}
    >
      {/* Contenido interior: rotación estática (nunca se anima durante la caída) */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          transform: `rotate(${numberRotation}deg)`,
          width: "100%",
        }}
      >
        {/* Día numérico — capa trasera: halo blanco ancho (z-index:1) */}
        <span className="calendar-date-number" aria-hidden="true" style={backStyle}>
          {date.day}
        </span>

        {/* Día numérico — capa delantera: relleno de color (z-index:2) */}
        <span className="calendar-date-number" aria-hidden="true" style={frontStyle}>
          {date.day}
        </span>

        {/* Imagen del día de la semana (PNG con tipografía original) — DELANTE (z-index:3) */}
        <img
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          className="calendar-weekday-img"
          aria-hidden="true"
          style={weekdayStyle}
        />
      </div>
    </div>
  );
});

CalendarCard.displayName = "CalendarCard";

export { CalendarCard };
