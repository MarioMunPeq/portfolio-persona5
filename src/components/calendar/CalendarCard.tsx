/**
 * Tarjeta individual de fecha del calendario tipo Persona 5.
 *
 * Cada composicion es un lockup vertical indivisible:
 *   - Wrapper exterior (position:absolute, se anima SOLO en y durante la caida).
 *   - Contenido interior (numero + PNG del dia de la semana): rotacion ESTATICA
 *     en CSS, nunca se anima su rotacion/x/scale/transformOrigin durante la caida.
 *
 * El numero usa tipografia Anton con un contorno blanco grueso, rojo o azul en fin
 * de semana y una ligera inclinacion distinta por digito, inspirado en el calendario
 * de Persona 5. No depende de imagenes rasterizadas de numeros.
 * La imagen del dia de la semana va DELANTE (z-index:3), empezando en el 85% de la
 * altura del numero (tapa su ~20% inferior).
 *
 * La sombra negra (drop-shadow) se aplica sobre el contenedor de las capas del
 * numero, NO sobre el texto blanco.
 *
 * El color de relleno del numero depende EXCLUSIVAMENTE del dia de la semana:
 *   Lunes a Viernes: #111 (casi negro)
 *   Sabado: #4fb3f0 (azul claro)
 *   Domingo: #e8112d (rojo)
 *
 * La rotacion del numero y de la imagen es diferente por cada dia.
 */
import { forwardRef, type Ref } from "react";
import {
  NUMBER_ROTATION_BY_INDEX,
  type CalendarDate,
} from "../../lib/calendar";
import { calendarAsset } from "../../lib/calendar";
import { useMediaQuery } from "../../lib/use-media-query";

interface CalendarCardProps {
  date: CalendarDate;
  /** Indice dentro del array de seis fechas (0-5). */
  index: number;
  /** Ref al wrapper exterior (el unico elemento que se anima en y durante la caida). */
  wrapperRef?: Ref<HTMLDivElement>;
  /** Ref al contenido interior (numero + imagen, rotacion estatica). */
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

/** Tamaño de fuente del numero (px) — visualmente dominante. */
const NUMBER_FONT_SIZE_BY_INDEX: Record<number, number> = {
  0: 105, // hoy-2
  1: 140, // ayer
  2: 200, // HOY — el numero mas grande de la pantalla
  3: 140, // hoy+1
  4: 105, // hoy+2
  5: 80, // hoy+3
};

/** Rotacion de la imagen del dia por indice (grados). Cada dia tiene un angulo distinto. */
const WEEKDAY_ROTATION_BY_INDEX: Record<number, number> = {
  0: 3, // hoy-2
  1: 2, // ayer
  2: 1, // HOY
  3: 3, // hoy+1
  4: 2, // hoy+2
  5: 1, // hoy+3
};

/** Ancho de cada composicion (px) — el numero domina visualmente. */
const CARD_WIDTH_BY_INDEX: Record<number, number> = {
  0: 130, // hoy-2
  1: 170, // ayer
  2: 280, // HOY (activo, el mas grande)
  3: 170, // hoy+1
  4: 130, // hoy+2
  5: 110, // hoy+3
};

const CalendarCard = forwardRef<HTMLDivElement, CalendarCardProps>(
  (props, forwardedRef) => {
    const { date, index, wrapperRef, contentRef } = props;

    const isTablet = useMediaQuery(
      "(min-width: 640px) and (max-width: 1023px)",
    );
    const isMobile = useMediaQuery("(max-width: 639px)");
    const widthScale = isMobile ? 0.45 : isTablet ? 0.8 : 1;

    const width = CARD_WIDTH_BY_INDEX[index] * widthScale;
    const fontSize = NUMBER_FONT_SIZE_BY_INDEX[index] * widthScale;
    const src = calendarAsset(date.weekdayFile);
    const numberRotation = NUMBER_ROTATION_BY_INDEX[index];
    const weekdayRotation = WEEKDAY_ROTATION_BY_INDEX[index];

    const digits = String(date.day).split("");
    const weekdayTopPx = fontSize * 0.82;

    const handleWrapperRef = (el: HTMLDivElement | null) => {
      assignRef(wrapperRef, el);
      assignRef(forwardedRef, el);
    };

    // Imagen del dia de la semana: DELANTE de ambas capas (z-index:3)
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
        {/* Contenido interior: rotacion estatica (nunca se anima durante la caida) */}
        <div
          ref={contentRef}
          style={{
            position: "relative",
            transform: `rotate(${numberRotation}deg)`,
            width: "100%",
          }}
        >
          <div
            className="calendar-date-number"
            aria-label={`${date.day}`}
            aria-hidden="true"
            style={{
              position: "relative",
              left: "50%",
              width: "max-content",
              height: `${fontSize}px`,
              fontSize: `${fontSize}px`,
              display: "flex",
              alignItems: "flex-end",
              gap: `${fontSize * 0.19}px`,
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          >
            {digits.map((digit, digitIndex) => {
              const color = date.weekday === 0 ? "#ed1026" : date.weekday === 6 ? "#42b9f2" : "#101014";
              const angle = digits.length > 1 ? (digitIndex === 0 ? -3.5 : 6) : -2.5;
              const lowerLeft = digits.length > 1 && digitIndex === 0 ? fontSize * 0.065 : 0;
              return (
                <span
                  key={`${digit}-${digitIndex}`}
                  className="calendar-date-digit"
                  style={{
                    color,
                    "--calendar-digit-angle": `${angle}deg`,
                    "--calendar-digit-lower": `${lowerLeft}px`,
                  } as React.CSSProperties}
                >
                  {digit}
                </span>
              );
            })}
          </div>

          {/* Imagen del dia de la semana (PNG con tipografia original) — DELANTE (z-index:3) */}
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
  },
);

CalendarCard.displayName = "CalendarCard";

export { CalendarCard };
