import type { Project } from "../../data/projects";
import { IMAGE_DIMS } from "../../data/image-dims";
import { PreviewBox } from "../ui/PreviewBox";

/**
 * Panel de captura del inventario: la gran imagen del proyecto en el
 * marco angular compartido (PreviewBox) con sombra roja dura, sello del
 * numero sobre la esquina y franja de rayas en el pie. El placeholder
 * unificado de "Captura pendiente" vive dentro de PreviewBox.
 */
export function ProjectPreview({ project }: { project: Project }) {
  const image = project.images?.[0] ?? null;
  const dims = image?.src ? IMAGE_DIMS[image.src] : undefined;

  return (
    <article className="project-preview relative">
      <div className="relative">
        {/* Sombra dura roja desplazada tras el marco */}
        <span
          aria-hidden="true"
          className="proj-frame absolute right-3 top-4 block h-full w-full bg-accent"
        />

        <PreviewBox
          src={image?.src ?? null}
          alt={image?.alt ?? `Captura pendiente de ${project.name}`}
          width={dims?.width}
          height={dims?.height}
          loading="eager"
          decoding="async"
          className="project-preview__frame"
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

      <div className="project-preview__copy relative">
        <div>
          <h2
            className="project-preview__title font-expose uppercase leading-[0.95] text-paper"
          >
            {project.name}
          </h2>
          <p className="project-preview__summary mt-3 max-w-2xl text-paper">
            {project.summary}
          </p>
        </div>
        <span aria-hidden="true" className="mt-4 flex items-center gap-3">
          <span className="block h-2 w-32 -skew-x-12 bg-accent" />
        </span>
      </div>
    </article>
  );
}
