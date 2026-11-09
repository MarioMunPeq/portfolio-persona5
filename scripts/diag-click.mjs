import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("console", (m) => console.log(`[PAGE] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[PAGE ERROR] ${e.message}`));

  console.log("Navegando al menú principal...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Buscar el botón de Habilidades (4º CommandNavItem)
  console.log("Buscando botón de Habilidades...");
  const buttons = await page.locator("button.hero-cmd").all();
  console.log(`Encontrados ${buttons.length} botones de comando`);

  for (let i = 0; i < buttons.length; i++) {
    const txt = await buttons[i].textContent();
    console.log(`  Botón ${i}: "${txt?.trim()}"`);
  }

  // Hacer clic en el 4º (index 3) - habilidades
  const habilidadBtn = buttons[3];
  if (!habilidadBtn) {
    console.log("No se encontró el botón de Habilidades");
    await browser.close();
    return;
  }

  console.log("Haciendo clic en Habilidades...");
  await habilidadBtn.click();

  // Esperar a que cambie la URL o aparezca data-transition
  try {
    await page.waitForURL("**/education", { timeout: 10000 });
    console.log("URL cambiada a /education");
  } catch (e) {
    console.log("URL no cambió en 10s:", e.message);
  }

  await page.waitForTimeout(3000);

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

  await page.screenshot({ path: "/tmp/edu-click.png", fullPage: true });
  console.log("Captura guardada: /tmp/edu-click.png");

  await browser.close();
})();
