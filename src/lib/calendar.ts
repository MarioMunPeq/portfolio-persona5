/**
 * Sistema de fechas del calendario tipo Persona 5.
 *
 * Una sola fuente de verdad para la fecha actual, el dia de la semana,
 * el dia numerico, la zona horaria local y la clasificacion dia/noche.
 * Se reutiliza la misma instancia `Date` que usa TopBar (hora local del
 * visitante) para evitar divergencias entre sistemas de fecha.
 *
 * Calcula seis fechas consecutivas: hoy-2, hoy-1, hoy, hoy+1, hoy+2,
 * hoy+3, con el dia actual centrado entre las fechas anteriores y futuras.
 * El constructor de `Date` con `setDate` gestiona automaticamente cambios
 * de mes, año y años bisiestos.
 */
export interface CalendarDate {
  date: Date;
  /** Dia del mes (1-31). */
  day: number;
  /** Indice de dia de la semana (0 = domingo, 6 = sabado). */
  weekday: number;
  /** Etiqueta en español (DOMINGO, LUNES…). */
  weekdayLabel: string;
  /** Nombre del archivo PNG correspondiente. */
  weekdayFile: string;
  /** True si es la fecha activa (hoy). */
  isToday: number;
}

/** Rotacion del numero por indice (grados) en la secuencia de entrada. */
export const NUMBER_ROTATION_BY_INDEX: Record<number, number> = {
  0: -5,
  1: -3,
  2: -4,
  3: -2,
  4: -1,
  5: -3,
};

/** Mapa de indice de dia de la semana a archivo de asset. */
const WEEKDAY_FILES: Record<number, string> = {
  0: "calendar_sunday.png",
  1: "calendar_monday.png",
  2: "calendar_tuesday.png",
  3: "calendar_wednesday.png",
  4: "calendar_thursday.png",
  5: "calendar_friday.png",
  6: "calendar_saturday.png",
};

/** Etiquetas en español para cada dia de la semana. */
const WEEKDAY_LABELS: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
};

/**
 * Calcula seis fechas consecutivas del calendario.
 *
 * Posicion 0 = hoy-2, posicion 1 = hoy-1 (ayer), posicion 2 = hoy (activa),
 * posicion 3 = hoy+1, posicion 4 = hoy+2, posicion 5 = hoy+3.
 *
 * @returns Array de 6 objetos CalendarDate ordenados cronologicamente.
 */
export function getCalendarDates(): CalendarDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: CalendarDate[] = [];

  for (let offset = -2; offset <= 3; offset++) {
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
 * Util para referenciar el dia central sin recorrer el array.
 */
export function getTodayDate(): CalendarDate {
  return getCalendarDates()[2];
}

/**
 * Clasifica el momento actual como dia o noche segun la hora local.
 *
 * Dia: 07:00–18:59 | Noche: 19:00–06:59 (hora local del visitante).
 *
 * @returns "day" o "night".
 */
export function getDayNight(): "day" | "night" {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "day" : "night";
}

/**
 * Ruta publica completa para un asset del calendario.
 */
export function calendarAsset(name: string): string {
  return `${import.meta.env.BASE_URL}images/calendar/${name}`;
}
