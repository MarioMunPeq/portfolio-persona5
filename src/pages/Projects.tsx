import { useState } from "react";
import { Screen } from "../components/transition/Screen";
import { ProjectPreview } from "../components/projects/ProjectPreview";
import { ProjectInventory } from "../components/projects/ProjectInventory";
import { SectionTitle } from "../components/ui/SectionTitle";
import { projects } from "../data/projects";
import type { Project } from "../data/projects";
import { withProjectMedia } from "../lib/project-media";

/**
 * Los proyectos con capturas en `src/assets/projects/<slug>/` resuelven su
 * galeria desde el sistema de archivos; el resto conserva las listas escritas
 * a mano en `data/projects.ts`.
 */
const PROJECTS = withProjectMedia(projects);

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
      {/* Estrellas de contorno sutiles de fondo */}
      <span className="absolute inset-0 bg-stars opacity-70" />

      {/* Starbackground: textura atmosferica compartida con la pagina de perfil.
          Posicionada hacia la izquierda/centro con rotacion diagonal sutil.
          Mascara angular para crear un recorte tipo panel grafico de P5.
          Opacidad ligeramente menor que en perfil para variedad visual. */}
      <span
        className="absolute -left-16 top-[10%] h-[120%] w-[65%] opacity-[0.12]"
        style={{
          backgroundImage: "url(/images/background/starbackground.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "rotate(-3deg)",
          maskImage:
            "linear-gradient(135deg, transparent 0%, black 30%, black 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(135deg, transparent 0%, black 30%, black 70%, transparent 100%)",
        }}
      />

      <span
        className="absolute right-[-3rem] top-[3%] -rotate-6 select-none font-display uppercase leading-none text-outline-faint opacity-25"
        style={{ fontSize: "clamp(6rem, 13vw, 12rem)" }}
      >
        Inventario
      </span>

      <span className="absolute -left-16 top-[46%] block h-2 w-[36rem] -rotate-[6deg] bg-accent/50" />
      <span className="absolute left-[26%] top-[72%] block h-px w-[30rem] -rotate-[3deg] bg-paper/15" />

      <span className="absolute inset-0 bg-scanlines" />
    </div>
  );
}

/**
 * Pantalla de proyectos = inventario del sistema. La gran captura del
 * proyecto seleccionado domina la izquierda; a la derecha, el selector
 * tipo inventario: filas de texto plano donde la seleccionada se pinta
 * con la colision de dos vigas sesgadas (cian + rojo). En escritorio,
 * hover/foco selecciona y el clic abre la ficha (/proyectos/:slug). En
 * movil/tactil, tocar una fila NO seleccionada la selecciona (actualiza
 * la vista previa de arriba) sin navegar; tocar la fila ya seleccionada
 * o su boton "ACCEDER" navega a la ficha.
 */
export function Projects() {
  const [selected, setSelected] = useState<Project>(PROJECTS[0]);

  return (
    <Screen className="bg-bg-hero text-paper">
      <section className="relative overflow-x-hidden min-h-screen">
        <ProjectsGraphicLayer />

        <div
          className="relative min-h-[calc(100vh-260px)] grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-4"
          style={{
            height: "calc(100vh - 260px)",
          }}
        >
          <div className="flex flex-col gap-4">
            <SectionTitle
              label="Inventario de proyectos"
              title="INVENTARIO"
              persona
              compact
            />
            <ProjectPreview project={selected} />
          </div>

          <ProjectInventory
            projects={PROJECTS}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </section>
    </Screen>
  );
}