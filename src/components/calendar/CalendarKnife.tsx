/**
 * Cuchillo del calendario tipo Persona 5.
 *
 * El PNG es horizontal: la hoja apunta a la izquierda, el mango a la
 * derecha. GSAP rota 45° en sentido horario para que la hoja clave
 * hacia abajo-izquierda (en diagonal sobre el día activo).
 *
 * El contenedor padre (knifeRef) es posicionado por GSAP con x/y en
 * píxeles y xPercent/yPercent: -50 para centrado. La imagen dentro
 * no necesita transform propio.
 */
import { forwardRef } from "react";
import { calendarAsset } from "../../lib/calendar";

const CalendarKnife = forwardRef<HTMLImageElement, {}>((_props, ref) => {
  return (
    <img
      ref={ref}
      src={calendarAsset("calendar_knife.png")}
      alt=""
      loading="eager"
      decoding="async"
      className="calendar-knife pointer-events-none"
      aria-hidden="true"
      style={{ position: "absolute", left: "0%", top: "0%" }}
    />
  );
});

CalendarKnife.displayName = "CalendarKnife";

export { CalendarKnife };
