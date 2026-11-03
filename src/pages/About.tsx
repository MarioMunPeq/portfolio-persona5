import { Reveal } from "../components/primitives/Reveal";
import { Screen } from "../components/transition/Screen";
import { DiamondMarker } from "../components/shared/DiamondMarker";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Tag } from "../components/ui/Tag";
import { StatTag } from "../components/ui/StatTag";
import { SocialStar } from "../components/social-star/SocialStar";
import { SkillMenuSection } from "../components/skill-menu/SkillMenuSection";
import { DrivingCar } from "../components/about/DrivingCar";
import { profile } from "../data/profile";

// Nombre en tres bloques (mismo tratamiento tipografico que el hero).
const nameParts = profile.name.trim().split(/\s+/);
const nameLine1 = nameParts[0] ?? "";
const nameLine2 = nameParts[1] ?? "";
const nameLine3 = nameParts.slice(2).join(" ");

const OUTLINE_BLACK = `-2px -2px 0 var(--color-bg-hero), 2px -2px 0 var(--color-bg-hero), -2px 2px 0 var(--color-bg-hero), 2px 2px 0 var(--color-bg-hero), -3px -3px 0 var(--color-bg-hero), 3px 3px 0 var(--color-bg-hero)`;
const OUTLINE_RED = `-2px -2px 0 var(--color-accent), 2px -2px 0 var(--color-accent), -2px 2px 0 var(--color-accent), 2px 2px 0 var(--color-accent), -3px -3px 0 var(--color-accent), 3px 3px 0 var(--color-accent)`;

// Atributos sociales del personaje (Social Stats de P5). Cada atributo tiene
// su propio valor (1-5) que decide cuanto se extiende su punta en la estrella
// interior: a mayor valor, mas lejos del centro. El orden fija la posicion
// alrededor de la estrella: arriba, arriba-derecha, abajo-derecha,
// abajo-izquierda, arriba-izquierda. Los acentos si son seguros: el
// unicode-range de P5 Menu/Expose los cae al fallback del stack. Valores
// aproximados y honestos, sin presentarse como datos objetivos.
const STATS = [
  { label: "PROGRAMACIoN", value: 4, descriptor: "DESARROLLO" },
  { label: "CREATIVIDAD", value: 3, descriptor: "DISEÑO" },
  { label: "CARISMA", value: 3, descriptor: "SOCIAL" },
  { label: "CURIOSIDAD", value: 5, descriptor: "INVESTIGACIoN" },
  { label: "RESOLUCIoN", value: 4, descriptor: "LoGICA" },
] as const;

// Posiciones de las etiquetas y sus inclinaciones suaves (casi horizontales).
// Las coordenadas horizontales/verticales se resuelven por CSS (clases
// .stat-tag--* en tokens.css), que en viewport estrecho acerca las etiquetas
// al centro para que quepan dentro del cuadrado de la estrella sin cortarse
// por los laterales. Solo la rotacion queda aqui.
const LABEL_ROTATIONS = [-1, -3, 3, -2, 1];

/** Hueco del retrato recortado en angulo. Sin avatar → placeholder. */
function PortraitSlot() {
  const { avatar } = profile.about;
  const CUTOUT =
    "[clip-path:polygon(10%_0,100%_0,100%_82%,86%_100%,0_100%,0_14%)]";
  return (
    <div className={`${CUTOUT} bg-paper p-[3px]`}>
      <div
        className={`${CUTOUT} aspect-[3/4] overflow-hidden bg-bg-content-alt`}
      >
        {avatar ? (
          <img
            src={avatar.src}
            alt={avatar.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative h-full w-full">
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-stripes-faint opacity-60"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-8 top-1/4 block h-3/5 w-14 bg-halftone-red opacity-25 [transform:rotate(14deg)]"
            />
            <span className="absolute right-3 top-3 flex items-center gap-1.5 bg-accent px-2 py-1 text-label font-medium uppercase tracking-[0.2em] text-paper">
              <DiamondMarker size={5} />
              No data
            </span>
            <div className="relative flex h-full flex-col items-center justify-center gap-4">
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className="h-24 w-24 opacity-30"
                fill="none"
                stroke="var(--color-paper)"
                strokeWidth="2"
              >
                <polygon points="50,5 61,38 96,38 68,59 79,92 50,71 21,92 32,59 4,38 39,38" />
              </svg>
              <span className="font-hand text-2xl leading-none text-paper/50">
                Retrato pendiente
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatStar() {
  return (
    /* `lg:pt-8 lg:-mt-4` amplía la caja de recorte 16 px hacia arriba y
       compensa con margen negativo: la etiqueta superior (centrada en
       top: 0% y con media altura fuera del cuadrado) deja de cortarse
       sin mover la estrella ni el resto de etiquetas. */
    <div className="relative w-full overflow-hidden pt-4 pb-4 lg:-mt-4 lg:pt-8">
      <div className="relative aspect-square w-full max-w-[280px] mx-auto lg:max-w-[34rem] lg:ml-auto lg:overflow-visible">
        <SocialStar className="absolute inset-0 h-full w-full [transform:rotate(2deg)]" />

        {STATS.map(({ label, value, descriptor }, i) => {
          return (
            <div
              key={label}
              className={`stat-tag stat-tag--${i}`}
              style={{
                transform: `translate(-50%,-50%) rotate(${LABEL_ROTATIONS[i]}deg)`,
              }}
            >
              <StatTag label={label} rank={value} descriptor={descriptor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function About() {
  const { about, hero } = profile;

  return (
    <Screen className="min-h-dvh bg-bg-hero text-paper">
      <section className="relative overflow-hidden px-6 pb-28 pt-16 md:px-12 lg:px-16 md:pt-20">
        {/* Fondo: estrellas de contorno sutiles (mismo patron que el inventario) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-stars opacity-70"
        />

        {/* Starbackground: textura atmosferica sutil detras de la composicion.
            Sesgada a la derecha (zona de estadisticas), con mascara que
            desvanece hacia la izquierda para no competir con la tarjeta
            de perfil. Opacidad baja para mantener la legibilidad. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-0 h-full w-[75%] opacity-[0.14]"
          style={{
            backgroundImage: "url(/images/background/starbackground.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 30%, black 100%)",
          }}
        />

        {/* Palabra fantasma de marca */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-2 z-0 hidden -rotate-6 select-none font-p5-menu uppercase leading-none text-outline-faint opacity-55 md:block"
          style={{ fontSize: "clamp(7rem, 15vw, 14rem)" }}
        >
          PERFIL
        </span>

        <div className="relative mx-auto max-w-[110rem] px-4 lg:px-8">
          {/* Titulo de perfil (mismo tratamiento que INVENTARIO) */}
          <Reveal>
            <SectionTitle title="PERFIL" persona />
          </Reveal>

          <div className="mt-10 grid items-start gap-16 lg:grid-cols-[0.38fr_0.62fr] lg:gap-8 xl:gap-12">
            {/* ===== Columna izquierda: identidad ===== */}
            <Reveal>
              <div className="relative">
                <div className="relative z-10 mx-auto w-[min(22rem,95%)] -rotate-2">
                  <PortraitSlot />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-3 -top-3 z-10 h-7 w-7"
                  >
                    <span className="absolute right-0 top-0 h-[2px] w-7 bg-accent" />
                    <span className="absolute right-0 top-0 h-7 w-[2px] bg-accent" />
                  </span>
                </div>

                {/* Nombre de identidad solapado sobre el retrato */}
                <div className="relative z-20 -mt-14 pl-2 lg:-mt-20 lg:pl-4">
                  <h1
                    className="font-display uppercase leading-[0.95]"
                    style={{ fontSize: "clamp(2.6rem, 5vw, 4.5rem)" }}
                  >
                    <span
                      className="block"
                      style={{
                        textShadow: OUTLINE_BLACK,
                        transform: "rotate(-1.5deg)",
                      }}
                    >
                      {nameLine1}
                    </span>
                    <span
                      className="block"
                      style={{
                        textShadow: OUTLINE_RED,
                        transform: "rotate(1.2deg) translateX(22px)",
                        marginTop: 4,
                      }}
                    >
                      {nameLine2}
                    </span>
                    <span className="block" style={{ marginTop: 8 }}>
                      <span
                        className="inline-block bg-accent px-5 pb-[5px] pt-[3px] text-ink [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"
                        style={{ transform: "skew(-6deg) rotate(-1deg)" }}
                      >
                        {nameLine3}
                      </span>
                    </span>
                  </h1>
                </div>

                {/* Pegatina de rol + credencial (DAM vive aqui, no en el footer) */}
                <div className="relative z-30 mt-4 flex flex-wrap items-center justify-start gap-2 pl-2 lg:justify-end lg:pr-2">
                  <Tag font="sans" className="rotate-1">
                    {hero.eyebrow}
                  </Tag>
                  <Tag font="sans" tone="dark" className="rotate-1">
                    {hero.credentialLine}
                  </Tag>
                </div>
              </div>
            </Reveal>

            {/* ===== Columna derecha: Social Stats (pieza central) ===== */}
            <div className="relative">
              {/* Panel de fondo de la composicion: textura de estrellas en
                  gris oscuro (sin rojo) que tapa las estrellas rojas del
                  fondo de pagina dentro de esta zona. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 bg-bg-hero bg-stars-charcoal opacity-80"
              />
              <Reveal delay={0.1}>
                <div className="relative">
                  <Tag
                    font="sans"
                    className="absolute right-2 top-0 z-10 -rotate-3"
                  >
                    Estadisticas sociales
                  </Tag>
                  <StatStar />
                </div>
              </Reveal>
            </div>
          </div>

          {/* ===== Contenido: Bio ===== */}
          <Reveal delay={0.16}>
            <div className="mt-14 lg:mt-16 lg:max-w-[55%]">
              <div className="relative border border-paper/8 bg-bg-content-alt/70 p-6 pr-8 sm:p-8 sm:pr-10 [clip-path:polygon(0_0,calc(100%_-_12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%_-_12px))]">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 h-5 w-5"
                >
                  <span className="absolute right-0 top-0 h-[1px] w-5 bg-accent/50" />
                  <span className="absolute right-0 top-0 h-5 w-[1px] bg-accent/50" />
                </span>
                <h2 className="flex items-center gap-2 text-label font-medium uppercase tracking-[0.22em] text-accent">
                  <DiamondMarker size={6} />
                  Bio
                </h2>
                <p className="mt-4 text-body leading-relaxed text-paper/75">
                  {about.bio}
                </p>
              </div>
            </div>
          </Reveal>

          {/* ===== Habilidades (menu de juego) ===== */}
          <SkillMenuSection skills={about.skills} />
        </div>

        {/* ===== Permiso de conducir — escena de conduccion a lo ancho ===== */}
        <Reveal delay={0.2}>
          <div className="relative mt-16">
            <p className="flex items-center gap-2 pl-6 text-caption uppercase tracking-[0.2em] text-paper/50 md:pl-12">
              <DiamondMarker size={5} />
              {about.license}
            </p>
            <DrivingCar className="mt-3" />
          </div>
        </Reveal>
      </section>
    </Screen>
  );
}
