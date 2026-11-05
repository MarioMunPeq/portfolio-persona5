import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Reveal } from "../components/primitives/Reveal";
import { Screen } from "../components/transition/Screen";
import { DiamondMarker } from "../components/shared/DiamondMarker";
import { PreviewBox } from "../components/ui/PreviewBox";
import { Lightbox } from "../components/ui/Lightbox";
import { projects } from "../data/projects";
import type { ProjectScreenshot } from "../data/projects";
import { withProjectMedia } from "../lib/project-media";

/** Igual que en el inventario: las galerias con carpeta en src/assets mandan. */
const PROJECTS = withProjectMedia(projects);

/* ── Font Awesome icons ── */
import {
  faReact,
  faNodeJs,
  faPython,
  faAndroid,
  faGitAlt,
  faJs,
  faCss3,
  faBluetooth,
} from "@fortawesome/free-brands-svg-icons";
import {
  faDatabase,
  faBrain,
  faCode,
  faServer,
  faBolt,
  faGears,
  faFilter,
  faGem,
  faCubes,
  faTerminal,
  faFlask,
  faCloudArrowUp,
  faMobileScreen,
  faBookOpen,
  faSearch,
  faLink,
  faUser,
  faShieldHalved,
  faRoute,
  faRss,
  faDiceD20,
  faThumbTack,
  faStar,
  faGraduationCap,
  faBook,
  faPuzzlePiece,
  faChartLine,
  faGamepad,
  faTableColumns,
  faScaleBalanced,
  faListOl,
  faCube,
  faShareNodes,
  faEarthAmericas,
  faTimeline,
  faWandMagicSparkles,
  faWater,
  faChartPie,
  faWindowMaximize,
  faStore,
  faUserGroup,
  faShapes,
  faBroadcastTower,
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";

/* ── Clip-paths reused from the site's visual system ── */
const TAG_CLIP =
  "polygon(0 0, calc(100% - 1rem) 0, 100% 1rem, 100% 100%, 0 100%)";

const STACK_CLIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 1rem), calc(100% - 1rem) 100%, 0 100%)";

const SUMMARY_CLIP =
  "polygon(0 0, calc(100% - 1.5rem) 0, 100% 1.5rem, 100% 100%, 0 100%)";

const FEATURE_CLIP =
  "polygon(0 0, calc(100% - 0.8rem) 0, 100% 0.8rem, 100% 100%, 0 100%)";

const ROTATIONS = [
  "-1.8deg",
  "1.2deg",
  "-0.8deg",
  "1.6deg",
  "-0.4deg",
  "0.7deg",
];

const GALLERY_ROTATIONS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg"];

/* ── Tech icon + role mapping ── */
type TechRole =
  | "FRONTEND"
  | "BACKEND"
  | "DATABASE"
  | "ORM"
  | "LENGUAJE"
  | "AI/ML"
  | "MOVIL"
  | "HERRAMIENTA"
  | "ROUTING"
  | "STATE"
  | "PWA"
  | "BAAS";

interface TechMeta {
  icon: typeof faCode;
  role: TechRole;
}

const TECH_META: Record<string, TechMeta> = {
  React: { icon: faReact, role: "FRONTEND" },
  "Node.js": { icon: faNodeJs, role: "BACKEND" },
  PostgreSQL: { icon: faDatabase, role: "DATABASE" },
  Prisma: { icon: faGem, role: "ORM" },
  TypeScript: { icon: faCode, role: "LENGUAJE" },
  "Tailwind CSS": { icon: faCss3, role: "FRONTEND" },
  Vite: { icon: faBolt, role: "HERRAMIENTA" },
  "Three.js": { icon: faCube, role: "HERRAMIENTA" },
  "React Three Fiber": { icon: faCubes, role: "HERRAMIENTA" },
  GSAP: { icon: faBolt, role: "HERRAMIENTA" },
  "d3-force": { icon: faShareNodes, role: "HERRAMIENTA" },
  Python: { icon: faPython, role: "LENGUAJE" },
  "scikit-learn": { icon: faBrain, role: "AI/ML" },
  Android: { icon: faAndroid, role: "MOVIL" },
  "HTML/CSS": { icon: faJs, role: "FRONTEND" },
  "Git/GitHub": { icon: faGitAlt, role: "HERRAMIENTA" },
  Liferay: { icon: faServer, role: "BACKEND" },
  Odoo: { icon: faGears, role: "BACKEND" },
  "Power Platform": { icon: faCubes, role: "HERRAMIENTA" },
  "Android Studio": { icon: faTerminal, role: "HERRAMIENTA" },
  Unity: { icon: faCubes, role: "HERRAMIENTA" },
  Godot: { icon: faCubes, role: "HERRAMIENTA" },
  Firebase: { icon: faFlask, role: "BAAS" },
  "React Router": { icon: faRoute, role: "ROUTING" },
  Zustand: { icon: faDatabase, role: "STATE" },
  PWA: { icon: faMobileScreen, role: "PWA" },
  JavaScript: { icon: faJs, role: "LENGUAJE" },
  RSS: { icon: faRss, role: "HERRAMIENTA" },
  "GitHub Actions": { icon: faGears, role: "HERRAMIENTA" },
  "GitHub Pages": { icon: faServer, role: "HERRAMIENTA" },
  Ollama: { icon: faBrain, role: "AI/ML" },
  Groq: { icon: faBrain, role: "AI/ML" },
  Kotlin: { icon: faCode, role: "LENGUAJE" },
  Jetpack: { icon: faCubes, role: "HERRAMIENTA" },
  Navigation: { icon: faRoute, role: "ROUTING" },
  SQLite: { icon: faDatabase, role: "DATABASE" },
  Retrofit: { icon: faServer, role: "BACKEND" },
  Gson: { icon: faCode, role: "HERRAMIENTA" },
  OkHttp: { icon: faServer, role: "BACKEND" },
  MPAndroidChart: { icon: faChartLine, role: "HERRAMIENTA" },
  "Bluetooth LE": { icon: faBluetooth, role: "HERRAMIENTA" },
  Gradle: { icon: faGears, role: "HERRAMIENTA" },
  jBCrypt: { icon: faShieldHalved, role: "HERRAMIENTA" },
  "Jupyter Notebook": { icon: faTerminal, role: "HERRAMIENTA" },
  pandas: { icon: faTableColumns, role: "HERRAMIENTA" },
  NumPy: { icon: faTableColumns, role: "HERRAMIENTA" },
  imblearn: { icon: faBrain, role: "AI/ML" },
  matplotlib: { icon: faChartLine, role: "HERRAMIENTA" },
  seaborn: { icon: faChartLine, role: "HERRAMIENTA" },
  "Riot Games API": { icon: faGamepad, role: "BACKEND" },
  requests: { icon: faServer, role: "HERRAMIENTA" },
  "Mapbox GL": { icon: faEarthAmericas, role: "HERRAMIENTA" },
};

function getTechMeta(tech: string): TechMeta {
  return TECH_META[tech] ?? { icon: faCode, role: "HERRAMIENTA" };
}

/* ── Feature icon mapping ── */
const FEATURE_ICONS: Record<string, typeof faCode> = {
  "Búsqueda instantánea": faSearch,
  "Compendio sin conexión": faBookOpen,
  "Relaciones entre entidades": faLink,
  "Gestión de personajes": faUser,
  "Seguimiento de combate": faShieldHalved,
  "Tirada de dados": faDiceD20,
  "Marcadores de sesión": faThumbTack,
  "Favoritos y recientes": faStar,
  "Modo principiante": faGraduationCap,
  "Referencia de reglas": faBook,
  "Copia de seguridad en la nube": faCloudArrowUp,
  "Aplicación web progresiva": faMobileScreen,
  "Múltiples fuentes de noticias": faRss,
  "Filtrado de ruido": faFilter,
  "Seguimiento curado de juegos": faGears,
  "Agrupación de historias": faCubes,
  "Resumen y puntuación con IA": faBrain,
  "Fallos controlados de IA": faShieldHalved,
  "Límite previo a la IA": faBolt,
  "Publicación sin infraestructura": faCloudArrowUp,
  "Automatización por hora": faBolt,
  "Frontend sin dependencias": faCode,
  "Registro de datos medicos": faDatabase,
  "Graficas interactivas": faChartLine,
  "Dispositivos Bluetooth de baja energia": faBluetooth,
  "Almacenamiento offline": faMobileScreen,
  "Sincronizacion con servidor": faCloudArrowUp,
  "Libro de vida": faBookOpen,
  "Permisos segun la version": faShieldHalved,
  "Control de bloqueo de pantalla": faBolt,
  "Datos reales de partidas": faGamepad,
  "Campeones candidatos por rol": faFilter,
  "Aprendizaje con arboles aleatorios": faCubes,
  "Balanceo de clases con SMOTE": faScaleBalanced,
  "Evaluacion completa del modelo": faChartLine,
  "Recomendacion Top-N": faListOl,
  "Feedback interactivo": faStar,
  "Mapa galactico de mundos": faEarthAmericas,
  "Lector de libros en 3D": faBookOpen,
  "Escena 3D del Aharietiam": faCube,
  "Cronologia cosmica": faTimeline,
  "Relaciones entre personajes": faShareNodes,
  "Ars Arcanum: sistemas de magia": faWandMagicSparkles,
  "Shadesmar: oceano de almas": faWater,
  "Visor y estadisticas": faChartPie,
  "Shell calcado del cliente de escritorio": faWindowMaximize,
  "Pagina de tienda por proyecto": faStore,
  "Panel de amigos como overlay": faUserGroup,
  "Buscador con filtro": faSearch,
  "Datos tipados y extensibles": faDatabase,
  "Iconografia SVG en linea": faShapes,
  "Modulo STAT": faUser,
  "Modulo MISIONES": faBookOpen,
  "Modulo DATA": faTerminal,
  "Modulo MAP": faEarthAmericas,
  "Modulo RADIO": faBroadcastTower,
  "Modulo HACK": faPuzzlePiece,
  "Carcasa y encendido reales": faPowerOff,
  "Secuencia de arranque": faTerminal,
};

/* ── Section header — condensed/stencil style ── */
function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <DiamondMarker size={8} />
      <h2 className="font-display text-base font-normal uppercase tracking-[0.2em] text-accent">
        {label}
      </h2>
    </div>
  );
}

/* ── Gallery image with angular frame + hard shadow ── */
function GalleryImage({
  screenshot,
  rotation,
  index,
  onOpen,
}: {
  screenshot: ProjectScreenshot;
  rotation: string;
  index: number;
  onOpen: () => void;
}) {
  const offsets = [
    "md:ml-[4%]",
    "md:ml-[8%]",
    "md:ml-[2%]",
    "md:ml-[10%]",
    "md:ml-[6%]",
  ];
  return (
    <button
      type="button"
      className={`group/gal relative cursor-pointer ${offsets[index % offsets.length]} border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}
      style={{ transform: `rotate(${rotation})`, zIndex: 10 + index }}
      onClick={onOpen}
      aria-label={`Ampliar captura: ${screenshot.alt}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        style={{
          clipPath: STACK_CLIP,
          transform: "translate(8px, 8px)",
        }}
      />
      <div
        className="relative border-2 border-paper/20 bg-bg-content-alt transition-colors duration-200 group-hover/gal:border-accent/60"
        style={{ clipPath: STACK_CLIP }}
      >
        <PreviewBox
          src={screenshot.src}
          alt={screenshot.alt}
          caption={screenshot.caption}
          className="relative"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-halftone-red/5"
          />
        </PreviewBox>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center border border-paper/30 bg-black/60 text-paper/50 opacity-0 transition-opacity duration-200 group-hover/gal:opacity-100"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 0.35rem) 0, 100% 0.35rem, 100% 100%, 0.35rem 100%, 0 calc(100% - 0.35rem))",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </span>
      </div>
    </button>
  );
}

/* ── Tech card — mini skill-deck card with icon + role ── */
function StackCard({ tech, index }: { tech: string; index: number }) {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const { icon, role } = getTechMeta(tech);
  const [viewBoxW, viewBoxH] = [icon.icon[0], icon.icon[1]];
  const pathData = icon.icon[4];

  return (
    <div
      className="group/card relative"
      style={{ transform: `rotate(${rotation})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        style={{
          clipPath: TAG_CLIP,
          transform: "translate(4px, 4px)",
        }}
      />
      <div
        className="relative flex items-center gap-3 border border-paper/40 bg-[linear-gradient(155deg,#1e1e1e_0%,#161616_55%,#101010_100%)] px-4 py-3 transition-all duration-200 group-hover/card:border-accent group-hover/card:[&_svg]:fill-accent"
        style={{ clipPath: TAG_CLIP }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015)_0_2px,transparent_2px_6px)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] border border-accent/0 transition-colors duration-200 group-hover/card:border-accent/40"
          style={{ clipPath: TAG_CLIP }}
        />
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          aria-hidden="true"
          className="relative h-5 w-5 shrink-0 fill-paper transition-colors duration-200"
        >
          {Array.isArray(pathData) ? (
            pathData.map((d) => <path key={d} d={d} />)
          ) : (
            <path d={pathData} />
          )}
        </svg>
        <div className="relative flex flex-col">
          <span className="text-body font-semibold leading-tight text-paper transition-colors duration-200 group-hover/card:text-accent">
            {tech}
          </span>
          <span className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.18em] text-paper/35 transition-colors duration-200 group-hover/card:text-accent/60">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  name,
  description,
  index,
}: {
  name: string;
  description: string;
  index: number;
}) {
  const icon = FEATURE_ICONS[name] ?? faPuzzlePiece;
  const [viewBoxW, viewBoxH] = [icon.icon[0], icon.icon[1]];
  const pathData = icon.icon[4];

  return (
    <Reveal delay={0.05 + index * 0.04} y={12}>
      <div
        className="group relative border border-paper/15 bg-bg-content-alt p-4 transition-all duration-200 hover:border-accent/40"
        style={{ clipPath: FEATURE_CLIP }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.01)_0_2px,transparent_2px_8px)]"
        />
        <div className="relative flex items-start gap-3">
          <svg
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 fill-accent/70 transition-colors duration-200 group-hover:fill-accent"
          >
            {Array.isArray(pathData) ? (
              pathData.map((d) => <path key={d} d={d} />)
            ) : (
              <path d={pathData} />
            )}
          </svg>
          <div>
            <h3 className="font-display text-sm font-normal uppercase tracking-[0.12em] text-paper transition-colors group-hover:text-accent">
              {name}
            </h3>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-paper/55">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Angular CTA button ── */
function AngularButton({
  children,
  href,
  external = false,
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      data-cursor="open"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`group relative inline-flex items-center justify-center overflow-hidden border-2 border-accent px-6 py-4 font-expose text-base uppercase tracking-[0.1em] text-paper clip-[polygon(0_0,94%_0,100%_100%,6%_100%)] transition-all duration-200 hover:bg-accent hover:text-ink ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-paper opacity-0 clip-[polygon(0_84%,100%_84%,100%_88%,0_88%)] group-hover:animate-[hero-glitch_0.22s_steps(3)_1] group-focus-visible:animate-[hero-glitch_0.22s_steps(3)_1]"
      />
      <span className="relative">{children}</span>
    </a>
  );
}

/* ── Prev / Next navigation ── */
function PrevNextNav({
  prev,
  next,
}: {
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
}) {
  const linkClass = `group relative flex flex-col gap-2 border-2 border-paper/25 bg-bg-content-alt px-6 py-5 transition-all duration-200 hover:border-accent hover:bg-accent hover:text-ink focus-visible:border-accent focus-visible:bg-accent focus-visible:text-ink`;
  const clipLeft = "polygon(0 0, 100% 0, calc(100% - 1rem) 100%, 0 100%)";
  const clipRight = "polygon(0 0, 100% 0, 100% 100%, 1rem 100%)";

  return (
    <nav aria-label="Navegacion entre proyectos">
      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/proyectos/${prev.slug}`}
            data-cursor="project"
            className={linkClass}
            style={{ clipPath: clipLeft }}
          >
            <span className="flex items-center gap-2 font-expose text-label font-medium uppercase tracking-[0.3em] text-paper/50 transition-colors group-hover:text-ink/70 group-focus-visible:text-ink/70">
              <DiamondMarker size={6} />
              Anterior
            </span>
            <span className="font-expose text-2xl uppercase leading-tight text-paper transition-colors group-hover:text-ink group-focus-visible:text-ink">
              {prev.name}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link
            to={`/proyectos/${next.slug}`}
            data-cursor="project"
            className={`${linkClass} items-end text-right`}
            style={{ clipPath: clipRight }}
          >
            <span className="flex items-center gap-2 font-expose text-label font-medium uppercase tracking-[0.3em] text-paper/50 transition-colors group-hover:text-ink/70 group-focus-visible:text-ink/70">
              Siguiente
              <DiamondMarker size={6} />
            </span>
            <span className="font-expose text-2xl uppercase leading-tight text-paper transition-colors group-hover:text-ink group-focus-visible:text-ink">
              {next.name}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN TEMPLATE — shared by all four project detail pages
   ════════════════════════════════════════════════════════════════ */
export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const project = PROJECTS.find((item) => item.slug === slug);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  if (!project) {
    return <Navigate to="/404" replace />;
  }

  const sectionLabel = "INVENTARIO";

  const currentIndex = PROJECTS.findIndex((p) => p.slug === slug);
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject =
    currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : null;

  return (
    <Screen className="min-h-dvh text-paper">
      {/* ── Background decorative layers ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-full w-[40vw] max-w-[600px] hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-accent) 100%)",
          opacity: 0.03,
          clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[1.5rem] bg-halftone-red opacity-10 hidden lg:block"
      />

      <section className="relative px-6 py-20 md:px-10 md:py-24 pb-40" style={{ paddingBottom: `calc(var(--bottombar-h) + 24px)` }}>
        <div className="mx-auto max-w-[var(--max-w-content)] relative z-10">
          {/* ═══ SECTION 1 — HEADER (full-width) ═══ */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-12 select-none font-expose uppercase leading-none text-outline-faint"
              style={{
                fontSize: "clamp(5rem, 13vw, 9rem)",
                transform: "rotate(-4deg)",
              }}
            >
              {project.name}
            </span>

            <Reveal>
              <Link
                to="/projects"
                data-cursor="back"
                className="group inline-flex items-center gap-3 border border-paper/20 bg-bg-content-alt px-5 py-2.5 transition-all duration-200 hover:border-accent hover:bg-accent/10"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 0.8rem) 0, 100% 0.8rem, 100% 100%, 0.8rem 100%, 0 calc(100% - 0.8rem))",
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 bg-accent rotate-45 transition-transform duration-200 group-hover:-translate-x-1"
                />
                <span className="font-sans text-[13px] font-medium uppercase tracking-[0.22em] text-paper/80 transition-colors group-hover:text-accent">
                  Volver a {sectionLabel}
                </span>
              </Link>
            </Reveal>

            <Reveal delay={0.05}>
              <h1
                className="mt-10 font-expose uppercase leading-[0.95] text-paper"
                style={{
                  fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)",
                  textShadow: "4px 4px 0 var(--color-accent-deep)",
                }}
              >
                {project.name}
              </h1>
            </Reveal>

            {/* Tagline */}
            {project.tagline && (
              <Reveal delay={0.07}>
                <p className="mt-3 font-sans text-sm uppercase tracking-[0.15em] text-paper/40">
                  {project.tagline}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.08}>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-2 w-32 -skew-x-12 bg-accent" />
                <span className="h-3 w-3 rotate-45 bg-gold" />
              </div>
            </Reveal>

            {/* Hero CTA */}
            {project.ctaUrl && (
              <Reveal delay={0.12}>
                <div className="mt-8">
                  <AngularButton href={project.ctaUrl} external>
                    {project.ctaLabel ?? "View Live Demo"}
                  </AngularButton>
                </div>
              </Reveal>
            )}
          </div>

          {/* ═══ TWO-COLUMN LAYOUT ═══ */}
          <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:mt-16 lg:grid-cols-[1fr_480px] lg:gap-10">
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-10">
              {/* Summary card */}
              <Reveal delay={0.15}>
                <div className="relative max-w-2xl">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-black"
                    style={{
                      clipPath: SUMMARY_CLIP,
                      transform: "translate(10px, 10px)",
                    }}
                  />
                  <div
                    className="relative p-[6px] md:p-[7px] bg-black"
                    style={{ clipPath: SUMMARY_CLIP }}
                  >
                    <div className="relative bg-white px-6 py-5 md:px-8 md:py-6">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
                      />
                      <div className="flex items-center gap-3">
                        <DiamondMarker size={7} />
                        <h2 className="font-display text-base font-normal uppercase tracking-[0.2em] text-ink">
                          Resumen
                        </h2>
                      </div>
                      <p className="mt-4 text-body leading-relaxed text-ink/70">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Tech Stack */}
              {project.stack && project.stack.length > 0 && (
                <Reveal delay={0.2}>
                  <div>
                    <SectionHead label="Stack tecnico" />
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {project.stack.map((tech, index) => (
                        <Reveal
                          key={tech}
                          delay={0.22 + index * 0.06}
                          y={16}
                          amount={0.3}
                        >
                          <StackCard tech={tech} index={index} />
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Mi rol / Aportación */}
              {project.role && (
                <Reveal delay={0.24}>
                  <div className="relative max-w-2xl">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-black"
                      style={{
                        clipPath: SUMMARY_CLIP,
                        transform: "translate(10px, 10px)",
                      }}
                    />
                    <div
                      className="relative p-[6px] md:p-[7px] bg-black"
                      style={{ clipPath: SUMMARY_CLIP }}
                    >
                      <div className="relative bg-white px-6 py-5 md:px-8 md:py-6">
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
                        />
                        <div className="flex items-center gap-3">
                          <DiamondMarker size={7} />
                          <h2 className="font-display text-base font-normal uppercase tracking-[0.2em] text-ink">
                            {project.role.title}
                          </h2>
                        </div>
                        <ul className="mt-4 space-y-3">
                          {project.role.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-3 text-body leading-relaxed text-ink/70"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent/60" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Retos técnicos */}
              {project.challenges && (
                <Reveal delay={0.26}>
                  <div>
                    <SectionHead label={project.challenges.title} />
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {project.challenges.items.map((challenge, i) => (
                        <Reveal
                          key={challenge.label}
                          delay={0.28 + i * 0.04}
                          y={12}
                          amount={0.3}
                        >
                          <div
                            className="group relative border border-paper/15 bg-bg-content-alt p-4 transition-all duration-200 hover:border-accent/40"
                            style={{ clipPath: FEATURE_CLIP }}
                          >
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.01)_0_2px,transparent_2px_8px)]"
                            />
                            <div className="relative">
                              <span className="font-display text-xs font-normal uppercase tracking-[0.12em] text-accent/80">
                                {challenge.label}
                              </span>
                              <p className="mt-2 text-[0.8rem] leading-relaxed text-paper/55">
                                {challenge.detail}
                              </p>
                            </div>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Links */}
              {(project.links.demo || project.links.github) && (
                <Reveal delay={0.3}>
                  <div>
                    <SectionHead label="Enlaces" />
                    <div className="mt-6 flex flex-wrap gap-4">
                      {project.links.demo && (
                        <AngularButton href={project.links.demo} external>
                          Ver demo
                        </AngularButton>
                      )}
                      {project.links.github && (
                        <AngularButton href={project.links.github} external>
                          Codigo
                        </AngularButton>
                      )}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* ── RIGHT COLUMN: Gallery (sticky on desktop) ── */}
            {project.screenshots && project.screenshots.length > 0 && (
              <Reveal delay={0.25}>
                <div className="lg:sticky lg:top-24">
                  <SectionHead label="Galeria" />
                  <div className="mt-6 space-y-10 md:space-y-8">
                    {project.screenshots.map((screenshot, i) => (
                      <GalleryImage
                        key={`${screenshot.alt}-${i}`}
                        screenshot={screenshot}
                        rotation={
                          GALLERY_ROTATIONS[i % GALLERY_ROTATIONS.length]
                        }
                        index={i}
                        onOpen={() =>
                          setLightbox({
                            src: screenshot.src ?? "",
                            alt: screenshot.alt,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          {/* ═══ FEATURES ═══ */}
          {project.features && project.features.length > 0 && (
            <Reveal delay={0.28}>
              <div className="mt-16 border-t border-paper/10 pt-10">
                <SectionHead label="Funcionalidades principales" />
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {project.features.map((feature, i) => (
                    <FeatureCard
                      key={feature.name}
                      name={feature.name}
                      description={feature.description}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* ═══ CONCEPT BLOCK (e.g. Why Offline-First?) ═══ */}
          {project.conceptBlock && (
            <Reveal delay={0.3}>
              <div className="mt-16 border-t border-paper/10 pt-10">
                <SectionHead label={project.conceptBlock.title} />
                <div className="mt-8 max-w-3xl">
                  {project.conceptBlock.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-body leading-relaxed text-paper/70"
                    >
                      {p}
                    </p>
                  ))}
                  {project.conceptBlock.highlights &&
                    project.conceptBlock.highlights.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-3">
                        {project.conceptBlock.highlights.map((h) => (
                          <span
                            key={h}
                            className="border border-accent/30 bg-accent/5 px-4 py-2 font-display text-xs font-normal uppercase tracking-[0.15em] text-accent"
                            style={{
                              clipPath:
                                "polygon(0 0, calc(100% - 0.5rem) 0, 100% 0.5rem, 100% 100%, 0.5rem 100%, 0 calc(100% - 0.5rem))",
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </Reveal>
          )}

          {/* ═══ DESIGN SYSTEM ═══ */}
          {project.designSystem && (
            <Reveal delay={0.32}>
              <div className="mt-16 border-t border-paper/10 pt-10">
                <SectionHead label={project.designSystem.title} />
                <div className="mt-8 max-w-3xl">
                  <p className="text-body leading-relaxed text-paper/70">
                    {project.designSystem.description}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {project.designSystem.points.map((point) => (
                      <div
                        key={point}
                        className="flex items-center gap-2 border border-paper/10 bg-bg-content-alt/50 px-3 py-2"
                        style={{ clipPath: FEATURE_CLIP }}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-accent/60" />
                        <span className="font-sans text-[0.7rem] uppercase tracking-[0.1em] text-paper/50">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* ═══ ARCHITECTURE ═══ */}
          {project.architecture && (
            <Reveal delay={0.34}>
              <div className="mt-16 border-t border-paper/10 pt-10">
                <SectionHead label={project.architecture.title} />
                {project.architecture.description && (
                  <p className="mt-4 max-w-3xl text-body leading-relaxed text-paper/60">
                    {project.architecture.description}
                  </p>
                )}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {project.architecture.layers.map((layer, i) => (
                    <Reveal key={layer.number} delay={0.36 + i * 0.06} y={12}>
                      <div
                        className="relative border border-paper/15 bg-bg-content-alt p-5"
                        style={{ clipPath: FEATURE_CLIP }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-accent/40"
                        />
                        <span className="font-display text-3xl font-normal text-accent/20">
                          {layer.number}
                        </span>
                        <h3 className="mt-2 font-display text-sm font-normal uppercase tracking-[0.12em] text-paper">
                          {layer.title}
                        </h3>
                        <p className="mt-2 text-[0.8rem] leading-relaxed text-paper/50">
                          {layer.description}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* ═══ CLOSING ═══ */}
          {project.closingLine && (
            <Reveal delay={0.38}>
              <div className="mt-20 border-t border-paper/10 pt-12 text-center">
                <p className="font-display text-lg font-normal uppercase tracking-[0.15em] text-paper/50">
                  {project.closingLine}
                </p>
                {project.ctaUrl && (
                  <div className="mt-8">
                    <AngularButton href={project.ctaUrl} external>
                      {project.ctaLabel ?? "View Live Demo"}
                    </AngularButton>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* ═══ PREV / NEXT ═══ */}
          {prevProject || nextProject ? (
            <Reveal delay={0.42}>
              <div className="mt-12">
                <PrevNextNav prev={prevProject} next={nextProject} />
              </div>
            </Reveal>
          ) : null}

          {/* Bottom accent */}
          <div
            aria-hidden="true"
            className="mt-8 h-px bg-gradient-to-r from-transparent via-paper/10 to-transparent"
          />
        </div>
      </section>
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </Screen>
  );
}
