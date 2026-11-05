import { useState } from "react";
import { Screen } from "../components/transition/Screen";
import { ProjectPreview } from "../components/projects/ProjectPreview";
import { ProjectInventory } from "../components/projects/ProjectInventory";
import { SectionTitle } from "../components/ui/SectionTitle";
import { projects } from "../data/projects";
import type { Project } from "../data/projects";

const PROJECTS = projects;

/**
 * Capa grafica de fondo del inventario: estrellas de contorno por toda la
 * pagina, palabra fantasma, cuñas diagonales y scanlines. Todo
 * decorativo y detras del contenido (z-10).
 */
function ProjectsGraphicLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Diagonal red accents and scanlines - kept as decorative background */}
      <span
        className="absolute -left-16 top-[10%] h-[120%] w-[65%] opacity-[0.12]"
        style={{
          background:
            "linear-gradient(135deg, transparent 0%, rgba(230,0,18,0.03) 30%, rgba(230,0,18,0.02) 70%, transparent 100%)",
          transform: "rotate(-3deg)",
        }}
      />

      <span className="absolute -left-16 top-[46%] block h-2 w-[36rem] -rotate-[6deg] bg-accent/50" />
      <span className="absolute left-[26%] top-[72%] block h-px w-[30rem] -rotate-[3deg] bg-paper/15" />

      <span className="absolute inset-0 bg-scanlines" />
    </div>
  );
}

/**
 * Pantalla de inventario: selector desplazable a la izquierda y vista
 * previa del proyecto seleccionado a la derecha. En escritorio,
 * hover/foco selecciona y el clic abre la ficha (/proyectos/:slug). En
 * movil/tactil, tocar una fila NO seleccionada la selecciona sin navegar;
 * tocar la fila ya seleccionada abre la ficha.
 */
export function Projects() {
  const [selected, setSelected] = useState<Project>(PROJECTS[0]);

  return (
    <Screen className="projects-screen text-paper">
      <section className="project-inventory-screen relative overflow-hidden">
        <ProjectsGraphicLayer />

        <div className="project-inventory-layout relative">
          <div className="project-inventory-selector">
            <SectionTitle
              label="Inventario de proyectos"
              title="INVENTARIO"
              persona
              compact
            />
            <ProjectInventory
              projects={PROJECTS}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <ProjectPreview project={selected} />
        </div>
      </section>
    </Screen>
  );
}
