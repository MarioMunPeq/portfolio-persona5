import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("console", (m) => console.log(`[PAGE] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[PAGE ERROR] ${e.message}`));

  console.log("Navegando a /education directamente (espera 8s)...");
  await page.goto("http://localhost:5173/education", { waitUntil: "networkidle" });
  await page.waitForTimeout(8000);

  const info = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("[data-node]")];
    return {
      nodeCount: nodes.length,
      hasSticker: !!document.querySelector(".edu-sticker"),
      dataTransition: document.documentElement.getAttribute("data-transition"),
      svgExists: !!document.querySelector("svg.edu-tree-svg"),
      nodeIds: nodes.map(n => n.getAttribute("data-id")),
      url: window.location.href,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: "/tmp/edu-direct.png", fullPage: true });
  console.log("Captura guardada: /tmp/edu-direct.png");

  await browser.close();
})();
