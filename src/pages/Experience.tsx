import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Screen } from "../components/transition/Screen";
import { PetalBackground } from "../components/primitives/PetalBackground";
import { experience } from "../data/experience";
import type { ExperienceEntry } from "../data/experience";
import { companyLogoCandidates } from "../lib/company-logo";

/* ================================================================
   CONSTANTS
   ================================================================ */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Siluetas angulares — cortes en esquinas opuestas.
const BUBBLE_LEFT =
  "polygon(0 0, calc(100% - 1.5rem) 0, 100% 1.5rem, 100% 100%, 1.5rem 100%, 0 calc(100% - 1.5rem))";
const BUBBLE_RIGHT =
  "polygon(1.5rem 0, 100% 0, 100% calc(100% - 1.5rem), calc(100% - 1.5rem) 100%, 0 100%, 0 1.5rem)";

const MESSAGE_VARIANTS = {
  hidden: (right: boolean) => ({
    opacity: 0,
    x: right ? 42 : -42,
    y: 18,
    rotate: right ? 1.5 : -1.5,
    scale: 0.96,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 190,
      damping: 22,
      mass: 0.85,
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
};

const MESSAGE_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 9 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE },
  },
};

// Ritmo visual por mensaje.
interface CardLayout {
  wrap: string;
  maxW: string;
  rot: string;
  sx: number;
  sy: number;
}
const LAYOUTS: CardLayout[] = [
  {
    wrap: "ml-[5%] mr-auto sm:ml-[8%] lg:mr-auto lg:ml-[4%]",
    maxW: "max-w-[72%] sm:max-w-[68%] lg:max-w-[44%]",
    rot: "-rotate-[1.2deg]",
    sx: 10,
    sy: 12,
  },
  {
    wrap: "mr-[5%] ml-auto sm:mr-[8%] lg:ml-auto lg:mr-[5%]",
    maxW: "max-w-[72%] sm:max-w-[68%] lg:max-w-[42%]",
    rot: "rotate-[0.9deg]",
    sx: 10,
    sy: 14,
  },
  {
    wrap: "ml-[5%] mr-auto sm:ml-[8%] lg:mr-auto lg:ml-[10%]",
    maxW: "max-w-[72%] sm:max-w-[68%] lg:max-w-[42%]",
    rot: "-rotate-[0.7deg]",
    sx: 9,
    sy: 12,
  },
  {
    wrap: "mr-[5%] ml-auto sm:mr-[8%] lg:ml-auto lg:mr-[4%]",
    maxW: "max-w-[72%] sm:max-w-[68%] lg:max-w-[45%]",
    rot: "rotate-[1.1deg]",
    sx: 10,
    sy: 12,
  },
];

// Conector angular.
interface Connector {
  ang: number;
  leftPct: number;
  shiftPx: number;
  // Mobile connector
  mShiftPx: number;
  mAng: number;
}
const CONNECTORS: Connector[] = [
  { ang: 26, leftPct: 44.5, shiftPx: 34, mShiftPx: 4, mAng: 22 },
  { ang: -26, leftPct: 56, shiftPx: 34, mShiftPx: -4, mAng: -22 },
  { ang: 26, leftPct: 48, shiftPx: 34, mShiftPx: 4, mAng: 22 },
  { ang: -26, leftPct: 52, shiftPx: 34, mShiftPx: -4, mAng: -22 },
];

/* ================================================================
   ReadChecks — doble check SVG
   ================================================================ */

function ReadChecks() {
  return (
    <svg
      viewBox="0 0 26 12"
      className="h-3 w-[26px] shrink-0"
      aria-hidden="true"
    >
      <path
        d="M1.5 6 L5 9.5 L10 4"
        fill="none"
        stroke="#B80404"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M9 6 L12.5 9.5 L18.5 3.5"
        fill="none"
        stroke="#B80404"
        strokeWidth="3.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function ActiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B80404] opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B80404]" />
    </span>
  );
}

/* ================================================================
   PageTitleBar — limpio: solo PROGRESO + EXPERIENCIA LABORAL
   ================================================================ */

function PageTitleBar() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 md:px-10 md:pt-12">
      <div className="lg:text-center">
        <h1
          className="mt-4 font-p5-menu uppercase leading-[0.85] tracking-tight text-white"
          style={{
            fontSize: "clamp(3rem, 9vw, 7.5rem)",
            textShadow: "6px 6px 0 #000, 8px 8px 0 rgba(0,0,0,0.3)",
          }}
        >
          Progreso
        </h1>
        <div className="mt-4 inline-flex items-center gap-0">
          <span className="h-[5px] w-4 bg-[#B80404]" />
          <span className="bg-white px-5 py-2 text-black [clip-path:polygon(0_0,100%_0,calc(100%_-_9px)_100%,0_100%)]">
            <span className="text-label font-bold uppercase tracking-[0.35em]">
              Experiencia laboral
            </span>
          </span>
        </div>
        <span
          aria-hidden="true"
          className="mt-5 flex items-center justify-center gap-3"
        >
          <span className="h-[6px] w-16 -skew-x-12 bg-white [box-shadow:4px_4px_0_#000]" />
          <span className="inline-block h-2 w-6 bg-[#B80404]" />
          <span className="h-[6px] w-6 -skew-x-12 bg-white [box-shadow:4px_4px_0_#000]" />
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   BackgroundDecorations — ghost text + lineas sutiles (sin rombos)
   ================================================================ */

function BackgroundDecorations() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <span className="absolute -right-8 top-[12%] select-none font-p5-menu text-[7rem] uppercase leading-none text-white/[0.03] md:text-[11rem] lg:text-[14rem]">
        Experiencia
      </span>
      <span className="absolute left-0 top-[28%] h-px w-28 -skew-x-12 bg-white/[0.06]" />
      <span className="absolute right-0 top-[58%] h-px w-20 -skew-x-12 bg-white/[0.06]" />
      <span className="absolute left-[10%] top-[75%] h-px w-16 -skew-x-12 bg-[#B80404]/[0.08]" />
      <span className="absolute left-[22%] top-[30%] flex items-center justify-center">
        <span className="h-px w-3 bg-white/[0.08]" />
        <span className="absolute h-3 w-px bg-white/[0.08]" />
      </span>
      <span className="absolute right-[25%] top-[65%] flex items-center justify-center">
        <span className="h-px w-3 bg-white/[0.08]" />
        <span className="absolute h-3 w-px bg-white/[0.08]" />
      </span>
    </div>
  );
}

/* ================================================================
   CompanyLogo — resolucion automatica
   ================================================================ */

function CompanyLogo({ company }: { company: string }) {
  const candidates = companyLogoCandidates(company);
  const [failed, setFailed] = useState<number[]>([]);
  const index = candidates.findIndex((_, i) => !failed.includes(i));

  if (index === -1) {
    return (
      <span className="flex h-full w-full items-center justify-center font-p5-menu text-2xl uppercase leading-none text-black md:text-3xl">
        {company.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={company}
      className="h-full w-full object-contain p-1.5"
      onError={() => setFailed((prev) => [...prev, index])}
    />
  );
}

/* ================================================================
   SpeakerAvatar — logo como avatar del interlocutor
   ================================================================ */

function SpeakerAvatar({
  entry,
  right,
  reduced,
}: {
  entry: ExperienceEntry;
  right: boolean;
  reduced: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`experience-message__avatar absolute z-30 h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] ${
        right
          ? "left-3 -top-6 md:left-auto md:-right-[4.5rem] md:top-7"
          : "right-3 -top-6 md:right-auto md:-left-[4.5rem] md:top-7"
      }`}
    >
      <motion.div
        className="h-full w-full border-[3px] border-black bg-white"
        style={{ boxShadow: "0 0 0 2px #B80404, 6px 6px 0 #000" }}
        initial={
          reduced
            ? { opacity: 1, scale: 1, rotate: right ? 3 : -3 }
            : { opacity: 0, scale: 0.55, rotate: right ? 13 : -13 }
        }
        whileInView={{
          opacity: 1,
          scale: 1,
          rotate: right ? 3 : -3,
        }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 17,
          delay: 0.16,
        }}
      >
        <CompanyLogo company={entry.company} />
      </motion.div>
    </div>
  );
}

/* ================================================================
   RoleRibbon — cinta angular del puesto (reemplaza la etiqueta)
   ================================================================ */

function RoleRibbon({ role }: { role: string }) {
  return (
    <motion.span
      variants={MESSAGE_ITEM_VARIANTS}
      className="mt-5 inline-block bg-white px-3.5 py-1.5 text-label font-bold uppercase tracking-[0.22em] text-black"
      style={
        {
          clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 6px 100%)",
        } as CSSProperties
      }
    >
      {role}
    </motion.span>
  );
}

/* ================================================================
   TechStamp — sello grafico de tecnologia
   ================================================================ */

function TechStamp({ tech }: { tech: string }) {
  return (
    <motion.span
      variants={MESSAGE_ITEM_VARIANTS}
      className="inline-flex items-center bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black"
      style={
        {
          clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
        } as CSSProperties
      }
    >
      <span
        aria-hidden="true"
        className="mr-1.5 inline-block h-[5px] w-[5px] bg-[#B80404]"
      />
      {tech}
    </motion.span>
  );
}

/* ================================================================
   OpenMessage — contenido interno del mensaje
   ================================================================ */

function OpenMessage({ entry }: { entry: ExperienceEntry }) {
  const isActive = entry.period?.toLowerCase().includes("actualidad") ?? false;
  return (
    <motion.div
      className="experience-message__body px-6 py-8 md:px-10 md:py-9"
      variants={{
        visible: {
          transition: { staggerChildren: 0.055, delayChildren: 0.08 },
        },
      }}
    >
      {/* Empresa — elemento dominante */}
      <motion.h3
        variants={MESSAGE_ITEM_VARIANTS}
        className="font-display uppercase leading-[0.9] text-white"
        style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.6rem)" }}
      >
        {entry.company}
      </motion.h3>

      {/* Linea roja bajo empresa */}
      <motion.span
        variants={MESSAGE_ITEM_VARIANTS}
        aria-hidden="true"
        className="mt-3 block h-[5px] w-16 -skew-x-12 bg-[#B80404] transition-all duration-200 group-hover:w-28"
      />

      {/* Rol — cinta angular */}
      <RoleRibbon role={entry.role} />

      {/* Fechas / ubicacion / meta */}
      <motion.div
        variants={MESSAGE_ITEM_VARIANTS}
        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70"
      >
        {entry.period && (
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-[3px] w-[3px] bg-[#B80404]"
            />
            {entry.period}
          </span>
        )}
        {entry.location && (
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-[3px] w-[3px] bg-[#B80404]"
            />
            {entry.location}
          </span>
        )}
        {entry.meta && (
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-[3px] w-[3px] bg-[#B80404]"
            />
            {entry.meta}
          </span>
        )}
      </motion.div>

      {/* Descripcion */}
      <motion.p
        variants={MESSAGE_ITEM_VARIANTS}
        className="mt-5 font-sans text-[15px] leading-relaxed text-white/90"
      >
        {entry.summary}
      </motion.p>

      {/* Highlights */}
      {entry.highlights.length > 0 && (
        <motion.ul
          variants={MESSAGE_ITEM_VARIANTS}
          className="mt-5 space-y-2 border-l-[2px] border-white/25 pl-4"
        >
          {entry.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex gap-2.5 text-[13px] leading-snug text-white/90"
            >
              <span
                aria-hidden="true"
                className="mt-[7px] h-[5px] w-[5px] shrink-0 bg-[#B80404]"
              />
              {highlight}
            </li>
          ))}
        </motion.ul>
      )}

      {/* Tech stamps */}
      {entry.tech && entry.tech.length > 0 && (
        <motion.div
          variants={MESSAGE_ITEM_VARIANTS}
          className="mt-5 flex flex-wrap gap-2"
        >
          {entry.tech.map((tech) => (
            <TechStamp key={tech} tech={tech} />
          ))}
        </motion.div>
      )}

      {/* Footer — contextual status */}
      <motion.div
        variants={MESSAGE_ITEM_VARIANTS}
        className="mt-7 flex items-center justify-end border-t border-white/20 pt-3"
      >
        {isActive ? (
          <span className="flex items-center gap-2">
            <ActiveDot />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
              Activo
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              Leido
            </span>
            <ReadChecks />
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ================================================================
   MessageBlock — composicion completa de un mensaje
   ================================================================ */

function MessageBlock({
  entry,
  index,
}: {
  entry: ExperienceEntry;
  index: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const right = index % 2 === 1;
  const poly = right ? BUBBLE_RIGHT : BUBBLE_LEFT;
  const layout = LAYOUTS[index % LAYOUTS.length];
  const conn = CONNECTORS[index - 1] ?? null;
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    [reduced ? 0 : 6, reduced ? 0 : -6],
  );

  return (
    <div className="experience-message group" ref={cardRef}>
      {/* Conector angular entre mensajes */}
      {conn && (
        <div className="relative h-14 md:h-56" aria-hidden="true">
          {/* Mobile connector — near-center, small skew */}
          <div
            className="absolute z-10 bg-black shadow-[3px_4px_0_rgba(0,0,0,0.35)] md:hidden"
            style={
              {
                top: "-3rem",
                left: `calc(50% - ${conn.mShiftPx}px)`,
                width: "clamp(1rem, 3vw, 1.75rem)",
                height: "calc(100% + 6rem)",
                transform: `skewX(${conn.mAng}deg)`,
                transformOrigin: "top left",
              } as CSSProperties
            }
          />
          {/* Desktop connector — original positioning, hidden on mobile */}
          <div
            className="absolute z-10 hidden bg-black shadow-[3px_4px_0_rgba(0,0,0,0.35)] md:block"
            style={
              {
                top: "-4rem",
                left: `calc(${conn.leftPct}% - ${conn.shiftPx}px)`,
                width: "clamp(1rem, 3vw, 1.75rem)",
                height: "calc(100% + 8rem)",
                transform: `skewX(${conn.ang}deg)`,
                transformOrigin: "top left",
              } as CSSProperties
            }
          />
        </div>
      )}

      <motion.div
        className="relative z-20"
        style={{ y: parallaxY }}
        custom={right}
        variants={MESSAGE_VARIANTS}
        initial={reduced ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className={`experience-message__card ${layout.maxW} ${layout.wrap} ${layout.rot}`}>
          <div className="relative">
            {/* Sombra dura offset */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black transition-transform duration-200 ease-out [transform:translate(var(--sx),var(--sy))]"
              style={
                {
                  clipPath: poly,
                  "--sx": `${layout.sx}px`,
                  "--sy": `${layout.sy}px`,
                } as CSSProperties
              }
            />

            {/* Marco blanco, conversacion oscura y acento rojo */}
            <div
              className="relative bg-white p-[5px] md:p-[6px]"
              style={{ clipPath: poly }}
            >
              <div className="relative bg-[#111] transition-colors duration-200 group-hover:bg-[#191919]">
                <div className="h-[3px] w-full bg-[#B80404]" />
                <OpenMessage entry={entry} />
              </div>
            </div>

            {/* Avatar */}
            <SpeakerAvatar entry={entry} right={right} reduced={reduced} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   Pagina
   ================================================================ */

export function Experience() {
  return (
    <Screen className="min-h-dvh bg-[#a40001] text-white">
      <PetalBackground />
      <section className="experience-screen relative min-h-dvh overflow-x-clip pt-11 md:pt-12">
        <BackgroundDecorations />
        <PageTitleBar />

        <div className="mx-auto max-w-7xl px-5 pb-24 md:px-10">
          <div className="mt-16 md:mt-20">
            {experience.map((entry, index) => (
              <MessageBlock key={entry.id} entry={entry} index={index} />
            ))}
          </div>

          {/* Fin de la conversacion */}
          <div className="mt-24 flex items-center justify-center gap-4">
            <span className="h-[6px] w-14 -skew-x-12 bg-white [box-shadow:4px_4px_0_#000]" />
            <span className="inline-flex items-center gap-2 bg-white px-4 py-2 text-label font-bold uppercase tracking-[0.3em] text-black [clip-path:polygon(0_0,100%_0,calc(100%_-_9px)_100%,0_100%)]">
              Fin de la conversacion
            </span>
            <span className="h-[6px] w-14 -skew-x-12 bg-white [box-shadow:4px_4px_0_#000]" />
          </div>
        </div>
      </section>
    </Screen>
  );
}
