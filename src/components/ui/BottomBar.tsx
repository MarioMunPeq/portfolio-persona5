import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { profile } from "../../data/profile";
import { MusicPlayer, type MusicPlayerHandle } from "../audio/MusicPlayer";
import { TRACKS } from "../../data/music";
import { gsap } from "gsap";

function trackUrl(file: string): string {
  return `${import.meta.env.BASE_URL}audio/${encodeURIComponent(file)}`;
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0 || s !== s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Icono de marca (FA brands) renderizado como SVG                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Reloj grande y protagonista: HH:MM blanco con contorno negro      */
/*  y sombra roja desplazada. Dos rombos rojos marcan el paso del tiempo. */
/* ------------------------------------------------------------------ */

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
        minutes: String(now.getMinutes()).padStart(2, "0"),
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
        <svg viewBox="0 0 24 32" aria-hidden="true">
          <polygon points="12,2 18,8 12,14 6,8" />
          <polygon points="12,18 18,24 12,30 6,24" />
        </svg>
      </span>
      {clock.minutes}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Boton-placa de red social: icono + texto + tecla de mando         */
/* ------------------------------------------------------------------ */

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
  const rotStyle = `--p5-rot: ${rot}deg`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-cursor="contact"
      className="p5-plate p5-plate--social p5-enter--bottom"
      style={{
        animationDelay: delay,
        ...(rotStyle ? { "--p5-rot": `${rot}deg` } : {}),
      } as unknown as React.CSSProperties}
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

/* ------------------------------------------------------------------ */
/*  menu de pistas — se despliega HACIA ARRIBA, anclado a la placa    */
/*  del reproductor. Se renderiza fuera del .p5-plate para que el     */
/*  clip-path no lo recorte.                                          */
/* ------------------------------------------------------------------ */

function TrackSelectorMenu({
  current,
  onSelect,
  onClose,
}: {
  current: number;
  onSelect: (e: React.MouseEvent, i: number) => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  /* Duraciones reales leidas de los archivos de audio (sin inventar). */
  const [durations, setDurations] = useState<number[]>(TRACKS.map(() => -1));

  // Animacion de entrada: wipe diagonal escalonado (40ms por fila)
  useEffect(() => {
    const items = listRef.current?.querySelectorAll(".p5-track-selector__item");
    if (!items?.length) return;
    items.forEach((el: Element, i: number) => {
      gsap.fromTo(
        el,
        {
          clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
          opacity: 0,
          x: 20,
        },
        {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          opacity: 1,
          x: 0,
          duration: 0.3,
          delay: i * 0.035,
          ease: "power2.out",
        },
      );
    });
  }, []);

  // Leer duraciones de metadatos al montar el selector
  useEffect(() => {
    const audios: HTMLAudioElement[] = [];
    TRACKS.forEach((_t, i) => {
      const a = new Audio(trackUrl(TRACKS[i].file));
      a.preload = "metadata";
      const onLoaded = () => {
        setDurations((prev) => {
          const n = [...prev];
          n[i] = a.duration;
          return n;
        });
      };
      a.addEventListener("loadedmetadata", onLoaded);
      audios.push(a);
    });
    return () => {
      audios.forEach((a) => {
        a.src = "";
      });
    };
  }, []);

  // Cerrar al hacer click fuera (pointerdown, no click) o Escape.
  // Se ignoran los clicks dentro de la lista.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [onClose]);

  return (
    <div className="p5-track-selector-wrap" onClick={(e) => e.stopPropagation()}>
      <span className="p5-plate-wrap" aria-hidden="true">
        <div className="p5-plate">
          <div className="p5-plate__shadow" />
          <div className="p5-plate__border" />
          <div className="p5-plate__fill" />
          <div className="p5-plate__inner" style={{ padding: 0 }}>
            <ul
              ref={listRef}
              className="p5-track-selector__list"
              role="listbox"
              aria-label="Seleccionar pista"
            >
              {TRACKS.map((t, i) => {
                const active = i === current;
                const dur = durations[i] >= 0 ? formatTime(durations[i]) : "--:--";
                return (
                  <li key={t.file}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`p5-track-selector__item${active ? " p5-track-selector__item--active" : ""}`}
                      onClick={(e) => onSelect(e, i)}
                    >
                      <span className="p5-track-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="p5-track-title">{t.title}</span>
                      <span className="p5-track-dur">{dur}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Barra inferior del menu principal                                 */
/* ------------------------------------------------------------------ */

/**
 * Barra inferior del menu principal — estilo Persona 5.
 *
 *   [reproductor] (placa, izquierda) … [reloj HH:MM ♦] (centro absoluto)
 *   … [GitHub] [LinkedIn] (placas, derecha)
 *
 * Sin fondo solido de barra; solo degradado negro suave (0.55 → 0) de
 * ~120px. Entrada desde abajo (0.5s, ease-out, escalonado 80ms).
 *
 * Se mantiene intacta la funcionalidad del reproductor (pista, pausa,
 * ecualizador) y los enlaces de GitHub y LinkedIn.
 */
export function BottomBar() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const musicPlayerRef = useRef<MusicPlayerHandle | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [trackIndex, setTrackIndex] = useState(0);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--bottombar-h",
        `${bar.getBoundingClientRect().height}px`,
      );
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={barRef} className="p5-bottombar">
      <div className="p5-bb-inner">
        {/* ── Izquierda: reproductor en placa inclinada ── */}
        <div className="p5-bb-player-wrapper">
          <MusicPlayer
            ref={musicPlayerRef}
            className="p5-player-root"
            onTrackChange={(i) => setTrackIndex(i)}
            onSelectorToggle={() => setSelectorOpen((v) => !v)}
          />

          {/* menu de pistas (hermano del reproductor, NO dentro: evita recorte por clip-path) */}
          {selectorOpen && (
            <div className="p5-track-selector-position">
              <TrackSelectorMenu
                current={trackIndex}
                onSelect={(e, i) => {
                  e.stopPropagation();
                  musicPlayerRef.current?.selectTrack(i);
                  setSelectorOpen(false);
                }}
                onClose={() => setSelectorOpen(false)}
              />
            </div>
          )}
        </div>

        {/* ── Centro: reloj grande (absoluto, perfectamente centrado) ── */}
        <DigitalClock />

        {/* ── Derecha: redes sociales como placas inclinadas ── */}
        <div className="p5-bb-social">
          {profile.links.github && (
            <SocialLink
              icon={faGithub}
              label={profile.links.github.label}
              url={profile.links.github.url}
              btnImg={`${import.meta.env.BASE_URL}images/ui/Button_L3.png`}
              delay="160ms"
              rot={-1.5}
            />
          )}
          {profile.links.linkedin && (
            <SocialLink
              icon={faLinkedin}
              label={profile.links.linkedin.label}
              url={profile.links.linkedin.url}
              btnImg={`${import.meta.env.BASE_URL}images/ui/Button_R3.png`}
              delay="240ms"
              rot={1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
