import type { ReactNode } from "react";
import { DiamondMarker } from "../primitives/DiamondMarker";

interface SectionTitleProps {
  title: ReactNode;
  /** Etiqueta pequeña con marcador angular bajo la que va el titulo. */
  label?: string;
  /** Fuente Persona 5 (ransom-note) para el titulo. */
  persona?: boolean;
  /** Fuente de la etiqueta: P5 Hatty (por defecto, legible como microcopy) o
      Expose (solo contextos grandes donde la fuente display se puede leer). */
  labelFont?: "hatty" | "expose";
  /** Reduce el tamanio del titulo solo en viewport estrecho (movil). */
  compact?: boolean;
  className?: string;
}

/**
 * Titulo de seccion unificado: etiqueta opcional + titulo grande (2 familias:
 * P5 Menu o display) + subrayado rojo sesgado + rombo dorado. La etiqueta
 * pequeña usa P5 Hatty por defecto — el mismo microcopy que el resto del
 * sitio — para que nunca se imprima una fuente display a tamaño ilegible.
 */
export function SectionTitle({
  title,
  label,
  persona = false,
  labelFont = "hatty",
  compact = false,
  className = "",
}: SectionTitleProps) {
  return (
    <header className={`relative ${className}`}>
      {label ? (
        <p
          className={`flex items-center gap-2.5 text-caption font-medium uppercase tracking-[0.22em] text-accent ${
            labelFont === "expose" ? "font-expose" : "font-hatty"
          }`}
        >
          <DiamondMarker size={8} />
          {label}
        </p>
      ) : null}

      <h1
        className={`section-title__h1 mt-3 uppercase leading-[0.95] text-paper ${
          persona ? "font-p5-menu" : "font-display"
        } ${compact ? "section-title__h1--compact" : ""}`}
        style={{ textShadow: "4px 4px 0 var(--color-accent-deep)" }}
      >
        {title}
      </h1>

      <span aria-hidden="true" className="mt-4 flex items-center gap-3">
        <span className="block h-2 w-44 -skew-x-12 bg-accent" />
        <span className="block h-3 w-3 rotate-45 bg-gold" />
      </span>
    </header>
  );
}
