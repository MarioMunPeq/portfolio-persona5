import { useLocation, useNavigate } from "react-router-dom";
import { P5Plate } from "./P5Plate";
import { profile } from "../../data/profile";
import { getTodayDate, calendarAsset } from "../../lib/calendar";
import { useEffect } from "react";

/**
 * Barra superior del menú principal — estilo Persona 5.
 *
 * Sin fondo sólido de barra: solo un degradado negro suave (0.55 → 0) de
 * ~120px de alto para legibilidad sobre el vídeo.
 *
 * Izquierda: botón compacto (max 16vw × 9vh):
 *   • En el menú principal ("/"): "xNaque" (p5hatty) + "DESARROLLADOR"
 *     (pequeño), NO clicable.
 *   • En cualquier otra pantalla: botón de regreso con icono de casa
 *     y texto "MENÚ".
 *     Click o Escape → vuelve al menú principal con fundido a negro
 *     existente. Hover: fondo rojo, placa 4px derecha, flecha 4px
 *     izquierda. Transición del texto con clip-path wipe (0.3s).
 * Centro: vacío.
 * Derecha: sello de fecha inspirado en los avisos del metaverso de Persona 5.
 */
export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMenu = pathname === "/";

  /* Si se pulsa Escape en una página interior, volver al menú. */
  useEffect(() => {
    if (isMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMenu, navigate]);

  const handleBack = () => {
    /* Fundido a negro existente: la transición de ruta se encarga de
       cubrir la pantalla. Navegamos directamente. */
    navigate("/");
  };

  const today = getTodayDate();
  const dayStr = String(today.day).padStart(2, "0");
  const monthShort = today.date.toLocaleString("es-ES", { month: "short" }).toUpperCase();

  return (
    <div className="p5-topbar">
      <div className="p5-topbar__inner">
        {/* ── Izquierda: botón compacto ── */}
        <div className="p5-topbar-left p5-enter--top" style={{ animationDelay: "0ms" }}>
          <P5Plate
            className={isMenu ? "" : "p5-plate--back"}
            rot={-2}
            style={{ "--p5-rot": "-2deg" } as unknown as React.CSSProperties}
          >
            {isMenu ? (
              <>
                <span className="p5-topbar-brand" aria-label={profile.branding.system}>
                  xNaque
                </span>
                <span className="p5-topbar-brand-sub">
                  DESARROLLADOR
                </span>
              </>
            ) : (
              <button
                type="button"
                className="p5-topbar-back"
                onClick={handleBack}
                aria-label="Volver al menú principal"
              >
                <span className="p5-topbar-back__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
                  </svg>
                </span>
                <span className="p5-topbar-back__label">MENÚ</span>
              </button>
            )}
          </P5Plate>
        </div>

        {/* Centro: vacío intencionalmente. */}

        {/* ── Derecha: sello de fecha estilo archivo P5 ── */}
        <div
          className="p5-date p5-enter--top"
          style={{ animationDelay: "80ms" }}
          role="img"
          aria-label={`${today.weekdayLabel}, ${today.day} de ${today.date.toLocaleString("es-ES", { month: "long" })}`}
        >
        <div className="p5-date__plate">
          <div className="p5-date__ink" aria-hidden="true">
            <span className="p5-date__month">{monthShort}</span>
            <span className="p5-date__day">{dayStr}</span>
              <img
                src={calendarAsset(today.weekdayFile)}
                alt=""
                className="p5-date__weekday"
                loading="eager"
                decoding="async"
                aria-hidden="true"
              />
              <span className="p5-date__slash" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
