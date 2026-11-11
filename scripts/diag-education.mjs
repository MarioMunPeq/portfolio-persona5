/**
 * diag-education.mjs
 * Diagnostico de la animacion de entrada de /education.
 * Captura a 1s, 3s, 6s y 10s y, para cada [data-node], imprime:
 *   getBoundingClientRect, opacity, visibility, atributo transform
 * Tambien imprime gsap.globalTimeline.getChildren().length a los 10s.
 */
import { chromium } from "playwright";

const URL = "http://localhost:5175/education";
const TIMES = [1000, 3000, 6000, 10000];

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on("console", (m) => console.log(`[PAGE CONSOLE] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[PAGE ERROR] ${e.message}`));

  await page.goto(URL, { waitUntil: "networkidle" });

  for (const t of TIMES) {
    await page.waitForTimeout(t);
    console.log(`\n===== t=${t}ms =====`);

    const info = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("[data-node]")];
      const nodeInfos = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        return {
          id: n.getAttribute("data-id"),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          opacity: cs.opacity,
          visibility: cs.visibility,
          transform: n.getAttribute("transform"),
          styleTransform: cs.transform,
          className: n.className,
        };
      });

      let gsapChildren = -1;
      let gsapReady = false;
      try {
        gsapChildren = window.gsap?.globalTimeline?.getChildren()?.length ?? -1;
        gsapReady = !!window.gsap;
      } catch (e) {
        gsapChildren = `ERR: ${e.message}`;
      }

      const svg = document.querySelector("svg.edu-tree-svg");
      const svgRect = svg ? svg.getBoundingClientRect() : null;

      return {
        nodeCount: nodes.length,
        nodeInfos,
        gsapChildren,
        gsapReady,
        svgRect: svgRect ? { x: svgRect.x, y: svgRect.y, w: svgRect.width, h: svgRect.height } : null,
        viewport: { w: window.innerWidth, h: window.innerHeight },
      };
    });

    console.log(JSON.stringify(info, null, 2));

    const out = `/tmp/edu-diag-${t}ms.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log(`[shot] ${out}`);
  }

  await browser.close();
  console.log("\n[diag] FIN");
})();
