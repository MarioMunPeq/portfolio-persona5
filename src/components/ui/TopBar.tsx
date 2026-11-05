import { P5Plate } from "./P5Plate";
import { profile } from "../../data/profile";
import { getTodayDate, calendarAsset } from "../../lib/calendar";

/**
 * Barra superior del menú principal — estilo Persona 5.
 *
 * Sin fondo sólido de barra: solo un degradado negro suave (0.55 → 0) de
 * ~120px de alto para legibilidad sobre el vídeo. Las piezas son placas
 * independientes flotando, con entrada desde arriba (0.5s, ease-out,
 * escalonado 80ms).
 *
 *   [MMP · MENU PRINCIPAL] (placa, izquierda) … centro vacío …
 *   [placa mini NOV] [número halo blanco + imagen del día] (derecha)
 */
export function TopBar() {
  const today = getTodayDate();
  const dayStr = String(today.day).padStart(2, "0");
  const monthShort = today.date.toLocaleString("es-ES", { month: "short" }).toUpperCase(); // "nov"

  return (
    <div className="p5-topbar">
      <div className="p5-topbar__inner">
        {/* ── Izquierda: MMP en placa inclinada ── */}
        <P5Plate
          className="p5-enter--top"
          style={{ animationDelay: "0ms", "--p5-rot": "-2deg" } as unknown as React.CSSProperties}
        >
          <span className="p5-mm" aria-label={profile.branding.system}>
            MMP
          </span>
          <span className="p5-mm-sub">
            {profile.branding.system.toUpperCase()}
          </span>
        </P5Plate>

        {/* Centro: vacío intencionalmente. */}

        {/* ── Derecha: fecha estilo calendario del juego ── */}
        <div className="p5-date">
          {/* Mini placa con el mes (sin solapar nada). */}
          <P5Plate
            className="p5-enter--top"
            style={{ animationDelay: "80ms", "--p5-rot": "1deg" } as unknown as React.CSSProperties}
            pad="clamp(6px, 0.5vw, 10px) clamp(12px, 1vw, 22px)"
          >
            {monthShort}
          </P5Plate>

          {/* Número grande con halo blanco (técnica CalendarCard). */}
          <div className="p5-day" aria-label={`${today.weekdayLabel} ${today.day}`}>
            <span className="p5-day__layer p5-day__back" aria-hidden="true">
              {dayStr}
            </span>
            <span className="p5-day__layer p5-day__front" aria-hidden="true">
              {dayStr}
            </span>
            {/* Imagen del día de la semana solapando el número. */}
            <img
              src={calendarAsset(today.weekdayFile)}
              alt=""
              className="p5-day__img"
              loading="eager"
              decoding="async"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
