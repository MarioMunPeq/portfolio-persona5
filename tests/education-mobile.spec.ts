import { test, expect } from "@playwright/test";

/**
 * Verificación de la versión móvil (≤768px) de /education.
 * Reusa la cabecera (TopBar) y la barra inferior (BottomBar) del Inventario.
 * Capturas en 360x740, 390x844 y 430x932, en scroll top / middle / bottom.
 */
const VIEWPORTS = [
  { name: "360x740", width: 360, height: 740 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
];

const SCROLLS: Array<{ name: string; ratio: number }> = [
  { name: "top", ratio: 0 },
  { name: "middle", ratio: 0.5 },
  { name: "bottom", ratio: 1 },
];

const SHOT_DIR = "C:/Users/Mario/AppData/Local/Temp/opencode/screenshots";

test.describe("educación móvil — ruta de formación", () => {
  for (const vp of VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({ viewport: vp });

      for (const scroll of SCROLLS) {
        test(`layout sin scroll horizontal (${scroll.name})`, async ({ page }) => {
          await page.goto("/education", { waitUntil: "networkidle" });
          /* Esperar a que termine la introducción del calendario (CalendarTransition
             deja document.documentElement.style.overflow = "hidden" mientras dura;
             el temporizador de seguridad la libera a los ~10 s). */
          await page
            .waitForFunction(() => document.documentElement.style.overflow !== "hidden", {
              timeout: 15000,
            })
            .catch(() => {});
          await page.waitForTimeout(900); /* fuentes y montaje GSAP tras la introducción */

          const maxScroll = await page.evaluate(() => {
            const el = document.scrollingElement;
            return Math.max(0, el.scrollHeight - el.clientHeight);
          });
          const y = maxScroll * scroll.ratio;
          await page.evaluate((yy: number) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(1000);

          const result = await page.evaluate(() => {
            const doc = document.documentElement;
            const innerW = window.innerWidth;
            const innerH = window.innerHeight;
            const scrollOk = doc.scrollWidth === innerW;

            /* Título visible y dentro del viewport. */
            const title = document.querySelector(".section-title__h1");
            let titleOk = false;
            let titleMsg = "no-title";
            if (title) {
              const r = title.getBoundingClientRect();
              titleOk =
                r.left >= -1 &&
                r.right <= innerW + 1 &&
                r.top >= -1 &&
                r.bottom <= innerH + 1;
              titleMsg = `L${r.left.toFixed(0)} R${r.right.toFixed(0)} T${r.top.toFixed(0)} B${r.bottom.toFixed(0)}`;
            }

            /* Marcador de nodo centrado sobre la espina (spine left 11px w 3px → centro 12.5px). */
            const spine = document.querySelector(".edu-m-spine");
            const markers = [...document.querySelectorAll(".edu-m-marker")];
            let spineOk = true;
            let spineMsg = "no-spine";
            if (spine && markers.length) {
              const sr = spine.getBoundingClientRect();
              const spineCx = sr.left + sr.width / 2;
              const off = markers.map((m) => {
                const r = m.getBoundingClientRect();
                return Math.abs((r.left + r.width / 2) - spineCx);
              });
              spineOk = off.every((d) => d <= 2);
              spineMsg = off.map((d) => d.toFixed(1)).join(",");
            }

            /* Ninguna tarjeta excede el viewport horizontalmente. */
            const cards = [...document.querySelectorAll(".edu-m-card")];
            const cardsOk = cards.every((c) => {
              const r = c.getBoundingClientRect();
              return r.left >= -1 && r.right <= innerW + 1;
            });
            let cardsMsg = "";
            if (!cardsOk) {
              cardsMsg = cards
                .map((c) => {
                  const r = c.getBoundingClientRect();
                  return `${Math.round(r.left)}..${Math.round(r.right)}`;
                })
                .join(",");
            }

            /* Tap targets >= 44px (menú y redes sociales). */
            const rect = (el: Element | null) => el ? el.getBoundingClientRect() : null;
            const tapOk = (r: DOMRect | null) => !!r && r.width >= 44 && r.height >= 44;
            const menuEl = document.querySelector(".p5-topbar-back");
            const menu = rect(menuEl);
            const socials = [...document.querySelectorAll(".p5-plate--social")]
              .map((el) => el.getBoundingClientRect());
            const ctrls = [...document.querySelectorAll(".p5-ctrl-btn, .edu-m-ctrl")]
              .map((el) => el.getBoundingClientRect());
            const visibleCtrls = ctrls.filter((r) => r && r.width > 0.5 && r.height > 0.5);

            /* Solapamiento barra inferior vs última tarjeta (solo en scroll bottom). */
            const barEl = document.querySelector(".p5-bottombar");
            const bar = rect(barEl);
            const lastCard = cards[cards.length - 1]?.getBoundingClientRect();
            let barOk = true;
            let barMsg = "no-bar-or-card";
            if (bar && lastCard) {
              barOk = bar.top >= lastCard.bottom - 1;
              barMsg = `bar.top=${bar.top.toFixed(0)} card.bottom=${lastCard.bottom.toFixed(0)}`;
            }

            /* Años dentro de la tarjeta horizontalmente. */
            const years = [...document.querySelectorAll(".edu-m-year")].map((el) => {
              const r = el.getBoundingClientRect();
              const card = el.closest(".edu-m-card")?.getBoundingClientRect();
              return {
                w: r.width,
                inside: card ? r.left >= card!.left - 1 && r.right <= card!.right + 1 : false,
                text: el.textContent,
              };
            });
            const yearsOk = years.every((y) => y.w > 0 && y.inside);

            return {
              scrollOk,
              scrollW: doc.scrollWidth,
              innerW,
              titleOk,
              titleMsg,
              spineOk,
              spineMsg,
              cardsOk,
              cardsMsg,
              taps: {
                menu: tapOk(menu),
                socials: socials.every(tapOk),
                ctrls: visibleCtrls.length > 0 && visibleCtrls.every(tapOk),
              },
              tapSizes: {
                menu: menu ? `${menu.width.toFixed(0)}x${menu.height.toFixed(0)}` : null,
                social: socials.map((r) => r ? `${r.width.toFixed(0)}x${r.height.toFixed(0)}` : null),
                ctrl: ctrls.map((r) => r ? `${r.width.toFixed(0)}x${r.height.toFixed(0)}` : null),
              },
              barOk,
              barMsg,
              yearsOk,
              years: years.map((y) => `${y.text} w=${y.w.toFixed(0)} inside=${y.inside}`),
            };
          });

          expect(result.scrollOk).toBe(true);
          expect(result.titleOk).toBe(true);
          expect(result.spineOk).toBe(true);
          expect(result.cardsOk).toBe(true);
          expect(result.taps.menu).not.toBeNull();
          expect(result.taps.socials).toBe(true);
          expect(result.taps.ctrls).toBe(true);
          if (scroll.name === "bottom") expect(result.barOk).toBe(true);
          expect(result.yearsOk).toBe(true);

          await page.screenshot({
            path: `${SHOT_DIR}/edu-${vp.name}-${scroll.name}.png`,
            fullPage: true,
          });
        });
      }
    });
  }
});
