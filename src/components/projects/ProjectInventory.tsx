import { useRef, type KeyboardEvent } from "react";
import type { Project } from "../../data/projects";
import { NavRow } from "../ui/NavRow";

interface ProjectInventoryProps {
  projects: Project[];
  selected: Project;
  onSelect: (project: Project) => void;
}

/**
 * Selector tipo inventario: lista vertical de proyectos con NavRow
 * (variantes active/inactive). Pasar el cursor (o el foco) por encima
 * selecciona la fila; las flechas arriba/abajo mueven la seleccion con
 * teclado y el clic navega a la ficha.
 */
export function ProjectInventory({
  projects,
  selected,
  onSelect,
}: ProjectInventoryProps) {
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const setItemRef = (index: number) => (el: HTMLAnchorElement | null) => {
    itemRefs.current[index] = el;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const index = projects.findIndex((p) => p.slug === selected.slug);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const next = (index + direction + projects.length) % projects.length;
    onSelect(projects[next]);
    itemRefs.current[next]?.focus();
  };

  return (
    <nav
      aria-label="Inventario de proyectos"
      className="relative overflow-y-auto"
    >
      <ol className="relative flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden" onKeyDown={onKeyDown}>
        {projects.map((project, index) => (
          <NavRow
            key={project.slug}
            label={project.name}
            path={`/proyectos/${project.slug}`}
            active={project.slug === selected.slug}
            onSelect={() => onSelect(project)}
            setItemRef={setItemRef(index)}
          />
        ))}
      </ol>
    </nav>
  );
}
