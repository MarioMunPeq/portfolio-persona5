/**
 * Tarjeta individual de fecha del calendario tipo Persona 5.
 *
 * Cada composición es un lockup vertical indivisible:
 *   Día numérico (ARRIBA) + PNG del día de la semana (ABAJO).
 * Ambos comparten el mismo eje horizontal central y se mueven
 * siempre como una sola unidad durante la caída.
 *
 * El color del número depende EXCLUSIVAMENTE del día de la semana:
 *   Lunes a Viernes: blanco
 *   Sábado: azul
 *   Domingo: rojo
 *
 * Esto es independiente de `isToday`. `isToday` solo controla la escala
 * y el énfasis visual (gestionados por GSAP en el padre), nunca el color.
 */
import type { CalendarDate } from "../../lib/calendar";
import { calendarAsset } from "../../lib/calendar";

interface CalendarCardProps {
  date: CalendarDate;
  /** Índice dentro del array de siete fechas (0-6). */
  index: number;
}

/** Color del día numérico según el día de la semana (índice JS: 0=Dom…6=Sáb). */
const NUMBER_COLOR_BY_WEEKDAY: Record<number, string> = {
  0: "#e60012", // domingo → rojo
  1: "#ffffff", // lunes → blanco
  2: "#ffffff", // martes → blanco
  3: "#ffffff", // miércoles → blanco
  4: "#ffffff", // jueves → blanco
  5: "#ffffff", // viernes → blanco
  6: "#2563eb", // sábado → azul
};

/** Ancho de cada composición (px) — el número domina visualmente. */
const CARD_WIDTH_BY_INDEX: Record<number, number> = {
  0: 130, // hoy-2
  1: 170, // hoy-1
  2: 280, // HOY (activo, el más grande)
  3: 170, // hoy+1
  4: 130, // hoy+2
  5: 110, // hoy+3
  6: 110, // hoy+4 (buffer)
};

/** Tamaño de fuente del número (px) — visualmente dominante. */
const NUMBER_FONT_SIZE_BY_INDEX: Record<number, number> = {
  0: 100, // hoy-2
  1: 125, // hoy-1
  2: 175, // HOY — el número más grande de la pantalla
  3: 125, // hoy+1
  4: 100, // hoy+2
  5: 85,  // hoy+3
  6: 85,  // hoy+4 (buffer)
};

export function CalendarCard({ date, index }: CalendarCardProps) {
  const width = CARD_WIDTH_BY_INDEX[index];
  const fontSize = NUMBER_FONT_SIZE_BY_INDEX[index];
  const src = calendarAsset(date.weekdayFile);
  const numberColor = NUMBER_COLOR_BY_WEEKDAY[date.weekday];

  return (
    <div
      aria-label={`${date.weekdayLabel} ${date.day}`}
      data-calendar-card
      data-index={String(index)}
      className="calendar-card pointer-events-none"
      style={{ width: `${width}px` }}
    >
      {/* Día numérico — arriba, visualmente dominante */}
      <span
        className="calendar-date-number"
        aria-hidden="true"
        style={{ color: numberColor, fontSize: `${fontSize}px` }}
      >
        {date.day}
      </span>

      {/* Imagen del día de la semana (PNG con tipografía original) — debajo */}
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        className="calendar-weekday-img"
        aria-hidden="true"
      />
    </div>
  );
}
