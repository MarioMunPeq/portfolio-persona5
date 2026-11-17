/* ════════════════════════════════════════════════════════════════════════════════════════════════
   useZone — mide los rectángulos reales de la UI fija y del título, y publica
   --zone-top / --zone-bottom / --zone-h en el elemento .edu-root.

   --zone-top  = max(31vh, título.bottom + 2vh)
   --zone-bottom = min(84vh, min(top reproductor, reloj, GitHub, LinkedIn) − 2vh)
   --zone-h = --zone-bottom − --zone-top (mínimo 0)

   Se mide también el menú y el título (referencia superior), pero ninguno de
   los dos entra en --zone-bottom. Se ejecuta en useLayoutEffect +
   ResizeObserver, y se re-mide tras las animaciones de entrada de TopBar y
   BottomBar (deslizamiento 0.5s) para que las zonas queden definitivas.
   ════════════════════════════════════════════════════════════════════════════════════════════════ */

import { useLayoutEffect, useState } from "react";

/* Selectores de la UI fija (TopBar / BottomBar de Layout, se reutilizan sin tocar). */
const MENU_SELECTOR = ".p5-topbar-back"; /* botón menú */
const TITLE_SELECTOR = ".section-title__h1"; /* título FORMACIÓN */
const BOTTOM_SELECTORS = [
  ".p5-bb-player-wrapper", /* reproductor */
  ".p5-bb-clock",          /* reloj */
  ".p5-plate--social",     /* GitHub y LinkedIn (dos enlaces) */
] as const;

interface UseZoneProps {
  rootRef: React.RefObject<HTMLElement | null> | null;
  enabled?: boolean;
}

interface ZoneValues {
  zoneTop: number;
  zoneBottom: number;
  zoneH: number;
}

export function useZone({
  rootRef,
  enabled = true,
}: UseZoneProps): ZoneValues | null {
  const [zone, setZone] = useState<ZoneValues | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    const vh = () => window.innerHeight * 0.01;

    const measure = (): void => {
      const root = rootRef?.current;
      if (!root) return;

      const rects: Record<string, DOMRect | null> = {
        menu: null,
        title: null,
        player: null,
        clock: null,
        github: null,
        linkedin: null,
      };

      /* Solo los elementos fijos de abajo determinan --zone-bottom. */
      const bottomTops: number[] = [];

      const capture = (sel: string, key: string, intoBottom: boolean): void => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          const r = el.getBoundingClientRect();
          rects[key] ??= r;
          if (intoBottom) bottomTops.push(r.top);
        });
      };

      capture(MENU_SELECTOR, "menu", false);
      capture(TITLE_SELECTOR, "title", false);

      const social = document.querySelectorAll<HTMLElement>(
        ".p5-bb-social .p5-plate--social",
      );
      social.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        rects[i === 0 ? "github" : "linkedin"] ??= r;
        bottomTops.push(r.top);
      });
      capture(BOTTOM_SELECTORS[0], "player", true);
      capture(BOTTOM_SELECTORS[1], "clock", true);

      const titleRect = document.querySelector<HTMLElement>(
        TITLE_SELECTOR,
      )?.getBoundingClientRect();
      const zoneTop = Math.max(
        31 * vh(),
        (titleRect?.bottom ?? 0) + 2 * vh(),
      );
      const zoneBottom =
        bottomTops.length === 0
          ? 84 * vh()
          : Math.min(84 * vh(), Math.min(...bottomTops) - 2 * vh());
      const zoneH = Math.max(0, zoneBottom - zoneTop);

      root.style.setProperty("--zone-top", `${zoneTop}px`);
      root.style.setProperty("--zone-bottom", `${zoneBottom}px`);
      root.style.setProperty("--zone-h", `${zoneH}px`);

      const next: ZoneValues = { zoneTop, zoneBottom, zoneH };
      setZone(next);
      (window as any).__eduZone = { ...next, rects };
    };

    measure();
    const raf = requestAnimationFrame(measure);
    /* Re-mide tras las animaciones de entrada (0.5s) para fijar las zonas. */
    const t1 = setTimeout(measure, 250);
    const t2 = setTimeout(measure, 550);
    const t3 = setTimeout(measure, 950);
    const onAnim = (): void => measure();
    document.addEventListener("animationend", onAnim, true);

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const titleEl = document.querySelector<HTMLElement>(TITLE_SELECTOR);
    if (titleEl) ro.observe(titleEl);

    return (): void => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.removeEventListener("animationend", onAnim, true);
      ro.disconnect();
    };
  }, [rootRef, enabled]);

  return zone;
}
