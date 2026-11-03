import type { Project } from "../../data/projects";
import { PreviewBox } from "../ui/PreviewBox";

/**
 * Panel de captura del inventario: la gran imagen del proyecto en el
 * marco angular compartido (PreviewBox) con sombra roja dura, sello del
 * numero sobre la esquina y franja de rayas en el pie. El placeholder
 * unificado de "Captura pendiente" vive dentro de PreviewBox.
 */
export function ProjectPreview({ project }: { project: Project }) {
  const image = project.images?.[0] ?? null;

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,21rem)] sm:max-w-[min(100%,28rem)] lg:mx-0 lg:max-w-[42rem]">
      <div className="relative">
        {/* Sombra dura roja desplazada tras el marco */}
        <span
          aria-hidden="true"
          className="proj-frame absolute right-3 top-4 block h-full w-full bg-accent"
        />

        <PreviewBox
          src={image?.src ?? null}
          alt={image?.alt ?? `Captura pendiente de ${project.name}`}
        >
          {/* Franja de rayas del pie del marco */}
          <span aria-hidden="true" className="flex h-2 overflow-hidden">
            <span className="h-full w-1/3 bg-stripes-red" />
            <span className="h-full flex-1 bg-accent" />
          </span>

          {/* Corchetes HUD en las cuatro esquinas del marco */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 z-10 text-accent opacity-70"
          >
            <span className="absolute left-0 top-0 h-5 w-5">
              <span className="absolute left-0 top-0 h-[2px] w-full bg-current" />
              <span className="absolute left-0 top-0 h-full w-[2px] bg-current" />
            </span>
            <span className="absolute right-0 top-0 h-5 w-5">
              <span className="absolute right-0 top-0 h-[2px] w-full bg-current" />
              <span className="absolute right-0 top-0 h-full w-[2px] bg-current" />
            </span>
            <span className="absolute bottom-0 left-0 h-5 w-5">
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-current" />
              <span className="absolute bottom-0 left-0 h-full w-[2px] bg-current" />
            </span>
            <span className="absolute bottom-0 right-0 h-5 w-5">
              <span className="absolute bottom-0 right-0 h-[2px] w-full bg-current" />
              <span className="absolute bottom-0 right-0 h-full w-[2px] bg-current" />
            </span>
          </span>

          {/* Bandera "SELECCIONADO" sobre el marco */}
          <span
            aria-hidden="true"
            className="absolute -top-3 right-5 z-10 inline-flex items-center gap-1.5 bg-halftone-red px-3 py-1 font-expose text-label font-medium uppercase tracking-[0.2em] text-paper [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]"
          >
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
            SELECCIONADO
          </span>
        </PreviewBox>
      </div>

      <div className="relative mt-4 sm:mt-6 lg:mt-10">
        <div>
          <h2
            className="font-expose uppercase leading-[0.95] text-paper"
            style={{
              fontSize: "clamp(2rem, 3.4vw, 3.25rem)",
              textShadow: "4px 4px 0 var(--color-accent-deep)",
            }}
          >
            {project.name}
          </h2>
          {/* Reserva 4 lineas (13px × 1.625) para que el bloque no cambie de
              alto al alternar proyectos con resumenes de 3 o 4 lineas. */}
          <p className="mt-2 min-h-[5.3rem] max-w-md text-caption leading-relaxed text-paper/70">
            {project.summary}
          </p>
        </div>
        <span aria-hidden="true" className="mt-4 flex items-center gap-3">
          <span className="block h-2 w-32 -skew-x-12 bg-accent" />
        </span>
      </div>
    </div>
  );
}
