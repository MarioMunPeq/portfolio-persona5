import { useEffect, useState } from "react";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { profile } from "../../data/profile";
import { MusicPlayer } from "../audio/MusicPlayer";
import { P5Plate } from "./P5Plate";
import { TRACKS } from "../../data/music";

/** Icono de marca (FA brands) renderizado como SVG con color actual. */
function BrandIcon({ icon }: { icon: typeof faGithub }) {
  const path = icon.icon[4];
  return (
    <svg
      viewBox={`0 0 ${icon.icon[0]} ${icon.icon[1]}`}
      aria-hidden="true"
      className="p5-social__icon shrink-0"
      fill="currentColor"
    >
      {Array.isArray(path) ? (
        path.map((d) => <path key={d} d={d} />)
      ) : (
        <path d={path} />
      )}
    </svg>
  );
}

/** Reloj digital centrado: HH:MM rojo con ♦ parpadeando entre 1 y 0.3. */
function DigitalClock() {
  const [clock, setClock] = useState({
    hours: String(new Date().getHours()).padStart(2, "0"),
    minutes: String(new Date().getMinutes()).padStart(2, "0"),
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({
        hours: String(now.getHours()).padStart(2, "0"),
        minutes: String(new Date().getMinutes()).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="p5-bb-clock p5-enter--bottom"
      style={{ animationDelay: "80ms" }}
      aria-label="Reloj"
    >
      {clock.hours}
      <span className="p5-bb-clock__dot" aria-hidden="true">
        ♦
      </span>
      {clock.minutes}
    </span>
  );
}

/** Botón-placa de red social: icono + texto + imagen de mando (L3 / R3). */
function SocialLink({
  icon,
  label,
  url,
  btnImg,
  delay,
  rot,
}: {
  icon: typeof faGithub;
  label: string;
  url: string;
  btnImg: string;
  delay: string;
  rot: number;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-cursor="contact"
      className="p5-plate p5-plate--social p5-enter--bottom p5-plate--social"
      style={{ animationDelay: delay, "--p5-rot": `${rot}deg` } as unknown as React.CSSProperties}
      aria-label={label}
    >
      <BrandIcon icon={icon} />
      <span>{label}</span>
      <img
        src={btnImg}
        alt=""
        className="p5-social__btnimg"
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
    </a>
  );
}

/** Menú de pistas — lista encima de la placa del reproductor.
   Se renderiza fuera del .p5-plate para que el clip-path del plate no lo recorte. */
function TrackSelectorMenu({
  current,
  onSelect,
  onClose,
}: {
  current: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="p5-track-selector-wrap" onClick={(e) => e.stopPropagation()}>
      <span className="p5-plate-wrap" aria-hidden="true">
        <div className="p5-plate">
          <div className="p5-plate__fill" />
          <div className="p5-plate__inner">
            <ul className="p5-track-selector__list" role="listbox" aria-label="Seleccionar pista">
              {TRACKS.map((t, i) => (
                <li key={t.file}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === current}
                    className={`p5-track-selector__item${i === current ? " p5-track-selector__item--active" : ""}`}
                    onClick={() => {
                      onSelect(i);
                      onClose();
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(TRACKS.length).padStart(2, "0")}{" "}
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </span>
    </div>
  );
}

/** Barra inferior del menú principal — estilo Persona 5.
 *
 *   [reproductor] (placa, izquierda) … [reloj HH:MM ♦] (centro absoluto)
 *   … [GitHub] [LinkedIn] (placas, derecha)
 *
 * Sin fondo sólido de barra: solo degradado negro suave (0.55 → 0) de
 * ~120px. Entrada desde abajo (0.5s, ease-out, escalonado 80ms).
 *
 * Se mantiene intacta la funcionalidad del reproductor (pista, pausa,
 * ecualizador) y los enlaces de GitHub y LinkedIn.
 */
export function BottomBar() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  return (
    <div className="p5-bottombar">
      <div className="p5-bb-inner">
        {/* ── Izquierda: reproductor en placa inclinada ── */}
        <div className="p5-bb-player-wrapper" style={{ position: "relative" }}>
          <P5Plate
            className="p5-enter--bottom p5-bb-player"
            style={{ animationDelay: "0ms", "--p5-rot": "-1deg" } as unknown as React.CSSProperties}
          >
            <MusicPlayer
              className="p5-bb-player"
              flat
              style={{ animationDelay: "0ms" }}
              trackIndex={trackIndex}
              onTrackChange={setTrackIndex}
              onSelectorToggle={() => setSelectorOpen((v) => !v)}
            />
          </P5Plate>

          {/* Menú de pistas (hermano del plate, no recortado por su clip-path) */}
          {selectorOpen && (
            <div className="p5-track-selector-position">
              <TrackSelectorMenu
                current={trackIndex}
                onSelect={(i) => {
                  setTrackIndex(i);
                  setSelectorOpen(false);
                }}
                onClose={() => setSelectorOpen(false)}
              />
            </div>
          )}
        </div>

        {/* ── Centro: reloj (absoluto, perfectamente centrado) ── */}
        <DigitalClock />

        {/* ── Derecha: redes sociales como placas inclinadas ── */}
        <div className="p5-bb-social">
          {profile.links.github && (
            <SocialLink
              icon={faGithub}
              label={profile.links.github.label}
              url={profile.links.github.url}
              btnImg="/images/ui/Button_L3.png"
              delay="160ms"
              rot={2}
            />
          )}
          {profile.links.linkedin && (
            <SocialLink
              icon={faLinkedin}
              label={profile.links.linkedin.label}
              url={profile.links.linkedin.url}
              btnImg="/images/ui/Button_R3.png"
              delay="240ms"
              rot={-1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
