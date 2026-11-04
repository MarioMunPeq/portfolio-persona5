/**
 * Sistema de fechas del calendario tipo Persona 5.
 *
 * Una sola fuente de verdad para la fecha actual, el día de la semana,
 * el día numérico, la zona horaria local y la clasificación día/noche.
 * Se reutiliza la misma instancia `Date` que usa TopBar (hora local del
 * visitante) para evitar divergencias entre sistemas de fecha.
 *
 * Calcula siete fechas consecutivas: hoy-2, hoy-1, hoy, hoy+1, hoy+2,
 * hoy+3, hoy+4. La última (hoy+4) es un buffer a la derecha que permite
 * el desplazamiento horizontal del calendario sin dejar huecos.
 * El constructor de `Date` con `setDate` gestiona automáticamente cambios
 * de mes, año y años bisiestos.
 */
export interface CalendarDate {
  date: Date;
  /** Día del mes (1-31). */
  day: number;
  /** Índice de día de la semana (0 = domingo, 6 = sábado). */
  weekday: number;
  /** Etiqueta en español (DOMINGO, LUNES…). */
  weekdayLabel: string;
  /** Nombre del archivo PNG correspondiente. */
  weekdayFile: string;
  /** True si es la fecha activa (hoy). */
  isToday: number;
}

/** Mapa de índice de día de la semana a archivo de asset. */
const WEEKDAY_FILES: Record<number, string> = {
  0: "calendar_sunday.png",
  1: "calendar_monday.png",
  2: "calendar_tuesday.png",
  3: "calendar_wednesday.png",
  4: "calendar_thursday.png",
  5: "calendar_friday.png",
  6: "calendar_saturday.png",
};

/** Etiquetas en español para cada día de la semana. */
const WEEKDAY_LABELS: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIÉRCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SÁBADO",
};

/**
 * Calcula siete fechas consecutivas del calendario.
 *
 * Posición 0 = hoy-2, posición 1 = hoy-1 (ayer), posición 2 = hoy (activa),
 * posición 3 = hoy+1, posición 4 = hoy+2, posición 5 = hoy+3,
 * posición 6 = hoy+4 (buffer a la derecha para el desplazamiento).
 *
 * @returns Array de 7 objetos CalendarDate ordenados cronológicamente.
 */
export function getCalendarDates(): CalendarDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: CalendarDate[] = [];

  for (let offset = -2; offset <= 4; offset++) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() + offset);

    const weekday = d.getDay();
    const isToday = offset === 0 ? 1 : 0;

    dates.push({
      date: d,
      day: d.getDate(),
      weekday,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      weekdayFile: WEEKDAY_FILES[weekday],
      isToday,
    });
  }

  return dates;
}

/**
 * Devuelve la fecha activa (hoy) como CalendarDate.
 * Útil para referenciar el día central sin recorrer el array.
 */
export function getTodayDate(): CalendarDate {
  return getCalendarDates()[2];
}

/**
 * Clasifica el momento actual como día o noche según la hora local.
 *
 * Día: 07:00–18:59 | Noche: 19:00–06:59 (hora local del visitante).
 *
 * @returns "day" o "night".
 */
export function getDayNight(): "day" | "night" {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "day" : "night";
}

/**
 * Ruta pública completa para un asset del calendario.
 */
export function calendarAsset(name: string): string {
  return `${import.meta.env.BASE_URL}images/Calendar/${name}`;
}
