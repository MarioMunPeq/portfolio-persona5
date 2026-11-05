import { Reveal } from "../components/primitives/Reveal";
import { Screen } from "../components/transition/Screen";
import { SectionTitle } from "../components/ui/SectionTitle";
import { SkillTreeSection } from "../components/skill-tree/SkillTreeSection";

/**
 * Formacion = arbol de Habilidades: ruta academica real (Telecomunicaciones ->
 * robotica y DAM -> Bootcamp de IA) como arbol de nodos hexagonales conectados
 * por tuberias, con panel de detalle.
 *
 * Background: Persona 5 editorial / graphic / collage.
 * Three depth layers:
 *   1. Dark textured base (charcoal + subtle warmth)
 *   2. Graphic layer (large red shapes + small geometric marks)
 *   3. Skill tree (nodes + pipes — highest contrast)
 */
export function Education() {
  return (
    <Screen className="min-h-dvh bg-bg-hero text-paper">
      <section className="education-screen relative min-h-dvh overflow-hidden px-6 pt-14 pb-20 md:px-10 md:pt-16 md:pb-24">
        {/* ═══ BASE: warm charcoal + subtle tonal variation ═══ */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 80% 60% at 25% 20%, #151210 0%, transparent 70%)",
              "radial-gradient(ellipse 70% 50% at 80% 85%, #141111 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 40% at 60% 50%, #0f0d0d 0%, transparent 50%)",
            ].join(", "),
          }}
        />

        {/* ═══ GRAIN: ultra-subtle noise via tiny gradient dots ═══ */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(245,245,240,0.025) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />

        {/* ═══ GRAPHIC LAYER: large red abstract shapes ═══ */}

        {/* Massive diagonal slash — upper-left to lower-right */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-[15%] top-[5%] h-[110%] w-[45%] -rotate-12 origin-center"
          style={{
            background:
              "linear-gradient(165deg, transparent 0%, rgba(120,8,8,0.06) 30%, rgba(100,6,6,0.04) 70%, transparent 100%)",
          }}
        />

        {/* Angular block — bottom-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-[8%] bottom-[10%] h-[35%] w-[30%] rotate-6"
          style={{
            background:
              "linear-gradient(140deg, rgba(110,8,8,0.05) 0%, rgba(90,6,6,0.03) 60%, transparent 100%)",
            clipPath: "polygon(0 15%, 100% 0, 85% 100%, 0 85%)",
          }}
        />

        {/* Upper-right diagonal block */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-[5%] top-0 h-[45%] w-[35%] -rotate-3"
          style={{
            background:
              "linear-gradient(200deg, rgba(100,7,7,0.05) 0%, transparent 70%)",
            clipPath: "polygon(20% 0, 100% 0, 100% 75%, 0 100%)",
          }}
        />

        {/* Large right-edge slash — strongly rotated */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-[12%] top-[30%] h-[60%] w-[22%] rotate-12"
          style={{
            background:
              "linear-gradient(to right, rgba(115,8,8,0.04) 0%, transparent 80%)",
          }}
        />

        {/* Bottom-right red mass */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-[10%] -bottom-[5%] h-[40%] w-[40%] -rotate-6"
          style={{
            background:
              "radial-gradient(ellipse at 70% 70%, rgba(105,8,8,0.05) 0%, transparent 60%)",
          }}
        />

        {/* Thin diagonal accent — across upper third */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[22%] h-px w-full -rotate-[1.5deg] bg-accent/[0.04]"
        />

        {/* ═══ SMALL GEOMETRIC MARKS ═══ */}

        {/* Diamond — top-left area */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[12%] top-[14%] hidden h-3 w-3 rotate-45 border border-accent/[0.08] md:block"
        />

        {/* Small cross — upper-right */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[15%] top-[20%] hidden md:block"
        >
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-paper/[0.06]" />
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-paper/[0.06]" />
        </span>

        {/* Dot — mid-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[8%] top-[48%] hidden h-1.5 w-1.5 rounded-full bg-accent/[0.1] lg:block"
        />

        {/* Small diamond — lower-right */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[22%] right-[10%] hidden h-2 w-2 rotate-45 bg-accent/[0.06] md:block"
        />

        {/* Tiny cross — lower-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[30%] left-[18%] hidden md:block"
        >
          <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-paper/[0.05]" />
          <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-paper/[0.05]" />
        </span>

        {/* Circle outline — upper-center-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[22%] top-[8%] hidden h-4 w-4 rounded-full border border-accent/[0.05] lg:block"
        />

        {/* Small square — lower-right edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[12%] right-[20%] hidden h-2 w-2 border border-paper/[0.04] md:block"
        />

        {/* Short horizontal dash — left mid */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[5%] top-[65%] hidden h-px w-8 -rotate-12 bg-paper/[0.05] lg:block"
        />

        {/* Tiny dot — right mid */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-[55%] hidden h-1 w-1 rotate-45 bg-accent/[0.08] lg:block"
        />

        {/* Short diagonal line — bottom-left */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[18%] left-[10%] hidden h-px w-6 -rotate-45 bg-paper/[0.04] md:block"
        />

        {/* ═══ CONTENT ═══ */}
        <div className="relative mx-auto max-w-6xl">
          <Reveal>
            <SectionTitle title="HABILIDADES" persona />
          </Reveal>

          <Reveal delay={0.14} amount={0.1}>
            <SkillTreeSection />
          </Reveal>
        </div>
      </section>
    </Screen>
  );
}
