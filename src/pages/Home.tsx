import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../components/transition/Screen";
import { CommandNavItem } from "../components/hero/CommandNavItem";
import { HERO_COMMANDS } from "../components/hero/hero-commands";
import { useBooted } from "../lib/boot";

const MENU_CHAOS = [
  { rotation: -2, offsetX: 10, widthPx: 400 },
  { rotation: 1.5, offsetX: -5, widthPx: 480 },
  { rotation: -1, offsetX: 16, widthPx: 440 },
  { rotation: 2, offsetX: 2, widthPx: 500 },
];

/**
 * Menu principal estilo Persona 5 — fondo de metro con video,
 * sin presentacion personal, navegacion angular a la izquierda
 * con entrada escalonada.
 */
export function Home() {
  const booted = useBooted();
  const [entered, setEntered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!booted || entered) return;
    const t = window.setTimeout(() => setEntered(true), 400);
    return () => window.clearTimeout(t);
  }, [booted, entered]);

  /* Keyboard shortcuts: 1-4 navigate to the corresponding section */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= HERO_COMMANDS.length) {
        e.preventDefault();
        navigate(HERO_COMMANDS[idx - 1].path);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <Screen className="bg-ink text-paper">
      <section className="relative h-dvh w-full overflow-hidden">
        {/* Video de metro como fondo */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="pointer-events-none fixed inset-0 z-0 w-[100vw] h-[100dvh] object-cover object-[center_center]"
          aria-hidden="true"
        >
          <source
            src={`${import.meta.env.BASE_URL}videos/metro-background.mp4`}
            type="video/mp4"
          />
        </video>

        {/* Capa de oscuridad sutil para legibilidad de la UI */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.35) 30%, rgba(10,10,10,0.1) 55%, transparent 100%)",
          }}
        />

        {/* Viñeta para profundidad */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, transparent 40%, rgba(10,10,10,0.3) 80%, rgba(10,10,10,0.45) 100%)",
          }}
        />

        {/* Scanlines sutiles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] bg-scanlines [mix-blend-mode:overlay]"
        />

        {/* Navegacion de comandos — columna izquierda compacta */}
        <nav
          aria-label="Menu principal del portfolio"
          className="absolute left-3 top-[45%] z-20 -translate-y-1/2 sm:left-[5%] sm:top-1/2 lg:left-[6%]"
        >
          <ol
            className={`flex w-[min(88vw,480px)] flex-col gap-3 sm:gap-4${entered ? " hero-commands--enter" : ""}`}
          >
            {HERO_COMMANDS.map((command, i) => (
              <CommandNavItem
                key={command.id}
                {...command}
                rotation={MENU_CHAOS[i].rotation}
                offsetX={MENU_CHAOS[i].offsetX}
                widthPx={MENU_CHAOS[i].widthPx}
              />
            ))}
          </ol>
        </nav>
      </section>
    </Screen>
  );
}
