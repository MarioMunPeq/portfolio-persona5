import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { Screen } from "../components/transition/Screen";
import { CommandNavItem } from "../components/hero/CommandNavItem";
import { HERO_COMMANDS } from "../components/hero/hero-commands";
import { useBooted } from "../lib/boot";
import { useMediaQuery } from "../lib/use-media-query";

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const isPhone = useMediaQuery("(max-width: 639px)");
  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!booted) return;
    const items = itemRefs.current.filter(
      (item): item is HTMLLIElement => item !== null,
    );
    if (reducedMotion) {
      gsap.set(items, {
        opacity: 1,
        "--menu-entry-x": "0px",
        "--menu-entry-scale": 1,
      });
      return;
    }

    const timeline = gsap.timeline({ delay: 0.4 });
    items.forEach((item, index) => {
      const flash = item.querySelector<HTMLElement>(".hero-command-flash");
      const at = index * 0.09;
      timeline.fromTo(
        item,
        {
          opacity: 0,
          "--menu-entry-x": "-72px",
          "--menu-entry-scale": 0.88,
        },
        {
          opacity: 1,
          "--menu-entry-x": "0px",
          "--menu-entry-scale": 1,
          duration: 0.42,
          ease: "back.out(1.7)",
        },
        at,
      );
      if (flash) {
        timeline
          .fromTo(
            flash,
            { opacity: 0 },
            { opacity: 0.9, duration: 0.04, ease: "none" },
            at + 0.42,
          )
          .to(flash, { opacity: 0, duration: 0.04, ease: "none" });
      }
    });
    return () => {
      timeline.kill();
    };
  }, [booted, reducedMotion]);

  useEffect(() => {
    const items = itemRefs.current;
    const tweens: gsap.core.Tween[] = [];
    items.forEach((item, index) => {
      if (!item) return;
      const selected = selectedIndex === index;
      const plate = item.querySelector<HTMLElement>(".hero-cmd");
      tweens.push(
        gsap.to(item, {
          "--menu-shift-x": selected ? (isPhone ? "6px" : "14px") : "0px",
          "--menu-angle": selected
            ? "0deg"
            : `${MENU_CHAOS[index]?.rotation ?? 0}deg`,
          "--menu-scale": selected
            ? isPhone
              ? 1.03
              : 1.06
            : selectedIndex === null
              ? 1
              : 0.97,
          opacity: selectedIndex === null || selected ? 1 : 0.55,
          duration: reducedMotion ? 0 : 0.18,
          ease: "back.out(2)",
          overwrite: "auto",
        }),
      );
      if (plate) {
        tweens.push(
          gsap.to(plate, {
            filter: selected
              ? "drop-shadow(6px 6px 0px #e8112d)"
              : "drop-shadow(0px 0px 0px transparent)",
            duration: reducedMotion ? 0 : 0.18,
            ease: "back.out(2)",
            overwrite: "auto",
          }),
        );
      }
    });
    return () => tweens.forEach((tween) => tween.kill());
  }, [selectedIndex, reducedMotion, isPhone]);

  /* Keyboard shortcuts and selection navigation for the four menu entries. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (selectedIndex === null) return;
        e.preventDefault();
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          (selectedIndex + direction + HERO_COMMANDS.length) %
          HERO_COMMANDS.length;
        setSelectedIndex(nextIndex);
        buttonRefs.current[nextIndex]?.focus();
        return;
      }

      if (e.key === "Enter") {
        if (selectedIndex === null) return;
        e.preventDefault();
        buttonRefs.current[selectedIndex]?.click();
        return;
      }

      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= HERO_COMMANDS.length) {
        e.preventDefault();
        buttonRefs.current[idx - 1]?.click();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedIndex]);

  return (
    <Screen className="bg-ink text-paper">
      <section className="relative h-dvh w-full overflow-hidden">
        {/* Video de metro como fondo */}
        {isTouch ? (
          <img
            src={`${import.meta.env.BASE_URL}images/background/background_redstars.webp`}
            alt=""
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 w-[100vw] h-[100dvh] object-cover object-[center_center]"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={`${import.meta.env.BASE_URL}images/background/background_redstars.webp`}
            className="pointer-events-none fixed inset-0 z-0 w-[100vw] h-[100dvh] object-cover object-[center_center]"
            aria-hidden="true"
          >
            <source
              src={`${import.meta.env.BASE_URL}videos/metro-background.webm`}
              type="video/webm"
            />
          </video>
        )}

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
            className="flex w-[min(88vw,480px)] flex-col gap-3 sm:gap-4"
          >
            {HERO_COMMANDS.map((command, i) => (
              <CommandNavItem
                key={command.id}
                {...command}
                index={i}
                selected={selectedIndex === i}
                onSelect={setSelectedIndex}
                setButtonRef={(index, element) => {
                  buttonRefs.current[index] = element;
                  itemRefs.current[index] =
                    element?.closest<HTMLLIElement>(".hero-command-item") ??
                    null;
                }}
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
