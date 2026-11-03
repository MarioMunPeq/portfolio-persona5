import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "../../lib/use-media-query";
import { transitionBus } from "../transition/transition-bus";

export type HeroIcon = "triangle" | "square" | "circle" | "cross" | "asterisk";

const ICONS: Record<HeroIcon, { glyph: string; colorClass: string }> = {
  triangle: { glyph: "△", colorClass: "text-face-tri" },
  square: { glyph: "□", colorClass: "text-face-sq" },
  circle: { glyph: "○", colorClass: "text-face-cir" },
  cross: { glyph: "✕", colorClass: "text-face-cross" },
  asterisk: { glyph: "※", colorClass: "text-face-ast" },
};

interface CommandNavItemProps {
  icon: HeroIcon;
  label: string;
  sub: string;
  subHover: string;
  path: string;
  rotation?: number;
  offsetX?: number;
  widthPx?: number;
}

/**
 * Item de navegación del menú principal — placa angular con icono de
 * mando (△ □ ○ ✕), label y subtítulo. Composición tipo Persona 5 con
 * ancho variable por item: INVENTARIO y HABILIDADES tienen más ancho
 * por ser palabras más largas, mientras que PERFIL y PROGRESO son más
 * estrechos. Hover feedback refinido: desplazamiento controlado, cambio
 * de profundidad mínimo y reacción sutil del icono.
 *
 * Navigation triggers the transition video FIRST, then navigates once
 * the screen is visually covered. This prevents the destination from
 * flashing before the transition overlay appears.
 */
export function CommandNavItem({
  icon,
  label,
  sub,
  subHover,
  path,
  rotation = 0,
  offsetX = 0,
  widthPx = 380,
}: CommandNavItemProps) {
  const { glyph, colorClass } = ICONS[icon];
  const navigate = useNavigate();
  const navigating = useRef(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleNav = async () => {
    if (navigating.current) return;
    navigating.current = true;
    if (!isDesktop) {
      navigate(path);
      return;
    }
    transitionBus.markExternallyStarted();
    await transitionBus.playUntilCovered();
    navigate(path);
  };

  // Determinar ancho base: los items de largo ancho (inventario, habilidades)
  // usan el widthPx especificado; los más estrechos pueden reducirse un
  // poco manteniendo un mínimo legible.
  const baseWidth = widthPx;
  const minWidth = 400;
  const maxWidth = 550;
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, baseWidth));

  return (
    <li
      className="hero-command-item"
      style={
        {
          "--off": `${offsetX}px`,
          "--rot": `${rotation}deg`,
          width: `${clampedWidth}px`,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={handleNav}
        data-cursor="open"
        className="hero-cmd metro-menu-btn group w-full border-none text-left"
      >
        <span aria-hidden="true" className="hero-cmd-track" />
        <span
          aria-hidden="true"
          className={`hero-btn-icon flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-current text-[17px] font-bold [transform:skewX(11deg)] ${colorClass} transition-transform [&]:hover:[transform:skewX(11deg)] [&]:focus-visible:[transform:skewX(11deg)] [&]:hover:rotate-2 [&]:focus-visible:rotate-2 [&]:hover:scale-105 [&]:focus-visible:scale-105`}>
          {glyph}
        </span>
        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap [transform:skewX(11deg)] font-p5-menu text-[22px] leading-none tracking-[0.02em] text-paper transition-colors duration-200 [text-shadow:2px_2px_0_color-mix(in_srgb,var(--color-ink)_60%,transparent)] group-hover:text-ink group-hover:[text-shadow:none] group-focus-visible:text-ink sm:text-[28px] lg:text-[30px] xl:text-[36px]">
          {label}
        </span>
        <span
          className="w-[130px] shrink-0 hidden self-center overflow-hidden whitespace-nowrap [transform:skewX(11deg)] md:block"
          aria-hidden="true"
        >
          <span className="hero-sub block transition-opacity duration-200 group-hover:opacity-0">
            {sub}
          </span>
          <span className="hero-sub hero-sub--hover pointer-events-none absolute inset-0 block transition-opacity duration-200 opacity-0 group-hover:opacity-100">
            {subHover}
          </span>
        </span>
      </button>
    </li>
  );
}
