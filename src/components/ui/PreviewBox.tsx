import type { ReactNode } from "react";

interface PreviewBoxProps {
  /** null = captura pendiente: se muestra el manuscrito rojo. */
  src: string | null;
  alt: string;
  /** Pie opcional sobre el marco. */
  caption?: string;
  /** Ancho intrinseco de la imagen (evita saltos de layout). */
  width?: number;
  /** Alto intrinseco de la imagen (evita saltos de layout). */
  height?: number;
  /** Politica de carga diferida (capturas no criticas: "lazy"). */
  loading?: "eager" | "lazy";
  /** Politica de descodificado de la imagen. */
  decoding?: "async" | "sync" | "auto";
  /** Capas decorativas sobre el marco (sombra roja, corchetes, sellos…). */
  children?: ReactNode;
  className?: string;
}

/**
 * Marco angular (esquinas cortadas) para capturas de proyecto. Mientras
 * no exista captura (src null) muestra "Captura pendiente" en manuscrito
 * rojo sobre trama de tinta — sin placeholders crudos. Deduplica el patron
 * de la vista previa del inventario y de la galeria de las fichas.
 */
export function PreviewBox({
  src,
  alt,
  caption,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  children,
  className = "",
}: PreviewBoxProps) {
  return (
    <figure
      className={`proj-frame relative overflow-hidden border-2 border-paper bg-bg-content-alt ${className}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            decoding={decoding}
            className="block h-full w-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Captura pendiente de ${alt}`}
            className="relative flex h-full w-full items-center justify-center overflow-hidden bg-halftone-ink"
          >
            <span
              aria-hidden="true"
              className="absolute -left-10 -top-8 block h-[130%] w-14 -skew-x-[16deg] bg-accent/20"
            />
            <span className="relative -rotate-3 font-hand text-3xl leading-none text-accent">
              Captura pendiente
            </span>
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 border-t border-paper/20 bg-halftone-red/80 px-4 py-3">
          <span className="text-label font-medium uppercase tracking-[0.22em] text-paper">
            {caption}
          </span>
        </figcaption>
      )}

      {children}
    </figure>
  );
}
