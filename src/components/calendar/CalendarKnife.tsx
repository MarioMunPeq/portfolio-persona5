/**
 * Cuchillo del calendario tipo Persona 5.
 *
 * El PNG es horizontal: la hoja apunta a la izquierda, el mango a la
 * derecha. GSAP lo lanza desde arriba a la derecha con un giro limpio de
 * media vuelta; la punta llega al dia activo y queda orientada abajo-izquierda.
 *
 * El contenedor padre (knifeRef) es posicionado por GSAP con x/y en
 * pixeles y xPercent/yPercent: -50 para centrado. La imagen dentro
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
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 20,
        opacity: 0,
        visibility: "hidden",
      }}
    />
  );
});

CalendarKnife.displayName = "CalendarKnife";

export { CalendarKnife };
