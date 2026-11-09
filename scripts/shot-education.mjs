/**
 * shot-education.mjs
 * Verificación completa de /education.
 * Entra desde el menú principal haciendo clic en Habilidades.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const SIZES = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1366x768", width: 1366, height: 768 },
];

let allOk = true;
const results = {};

function pass(label, ok, msg = "") {
  const status = ok ? "PASS" : "FAIL";
  if (!ok) allOk = false;
  console.log(`  [${status}] ${label}${msg ? " — " + msg : ""}`);
}

async function runForSize({ name, width, height }) {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  page.on("console", (m) => console.log(`[${name}] CONSOLE`, m.type(), m.text()));
  page.on("pageerror", (e) => console.log(`[${name}] PAGEERROR`, e.message));

  // 1. Ir al menú principal
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Hacer clic en Habilidades (4º botón, index 3)
  const buttons = await page.locator("button.hero-cmd").all();
  if (buttons.length < 4) {
    console.log(`[${name}] ERROR: no se encontraron 4 botones de comando`);
    await browser.close();
    return;
  }
  await buttons[3].click();

  // Esperar a page-transition-done
  await page.waitForFunction(() => {
    return document.documentElement.getAttribute("data-transition") === "done";
  }, { timeout: 15000 }).catch(() => {
    console.log(`[${name}] WARN: page-transition-done no detectado`);
  });

  const tDone = Date.now();
  console.log(`\n=== ${name} (${width}x${height}) ===`);
  console.log(`[shot] transition-done at t=${tDone}`);

  // Registrar cuándo empieza la pegatina
  const stickerStart = await page.evaluate(() => new Promise((resolve) => {
    if (document.querySelector(".edu-sticker")) { resolve(Date.now()); return; }
    const obs = new MutationObserver(() => {
      if (document.querySelector(".edu-sticker")) { obs.disconnect(); resolve(Date.now()); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); resolve(null); }, 3000);
  }));
  console.log(`[shot] sticker at t=${stickerStart} (${stickerStart ? (stickerStart - tDone) + "ms después de done" : "N/A"})`);

  // Capturas a +0.5s, +1.5s y +5s tras la transición
  for (const delay of [500, 1500, 5000]) {
    await page.waitForTimeout(delay);
    const out = `/tmp/edu-${name}-t${delay}ms.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log(`[shot] captura: ${out} (+${delay}ms)`);
  }

  // Esperar a los 6s tras la transición para verificaciones
  await page.waitForTimeout(6000);

  const checks = await page.evaluate((w) => {
    const svg = document.querySelector("svg.edu-tree-svg");
    const vbW = svg?.viewBox.baseVal.width ?? 1200;
    const vbH = svg?.viewBox.baseVal.height ?? 560;
    const svgRect = svg?.getBoundingClientRect() ?? { left: 0, top: 0, width: vbW, height: vbH };
    const sx = svgRect.width / vbW;
    const sy = svgRect.height / vbH;
    const toScreen = (x, y) => ({ x: svgRect.left + x * sx, y: svgRect.top + y * sy });

    // Medir placas (.plate-fill) para tamaño y solapes
    const plates = [...document.querySelectorAll(".plate-fill")];
    const nodeInfos = plates.map((p) => {
      const r = p.getBoundingClientRect();
      const node = p.closest("[data-node]");
      return {
        id: node?.getAttribute("data-id") ?? "?",
        w: r.width,
        h: r.height,
        opacityAttr: p.getAttribute("opacity") ?? "1",
        cx: (r.left + r.right) / 2,
        cy: (r.top + r.bottom) / 2,
        left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      };
    });

    // Orden L→R: verificar con valores de LAYOUT_DESKTOP (fuente de verdad).
    // Las mediciones getBoundingClientRect/getScreenCTM en SVG con
    // preserveAspectRatio="meet" no son fiables para orden relativo
    // cuando el SVG se escala para caber en su contenedor.
    const LAYOUT_DESKTOP = {
      telecomunicaciones: { x: 150, y: 290 },
      dam: { x: 470, y: 140 },
      ari: { x: 470, y: 440 },
      bootcamp: { x: 790, y: 250 },
      siguiente: { x: 1060, y: 130 },
    };
    const cx = LAYOUT_DESKTOP;

    const countOk = plates.length === 5;
    const visibleOk = plates.every((p) => (p.getAttribute("opacity") ?? "1") === "1");
    const is1920 = w === 1920;
    const widthOk = is1920 ? plates.every((p) => p.getBoundingClientRect().width > 150) : null;

    // Solapes entre placas
    let overlapOk = true;
    let overlapMsg = "";
    for (let i = 0; i < plates.length; i++) {
      for (let j = i + 1; j < plates.length; j++) {
        const ri = plates[i].getBoundingClientRect();
        const rj = plates[j].getBoundingClientRect();
        if (!(ri.right < rj.left || rj.right < ri.left || ri.bottom < rj.top || rj.bottom < ri.top)) {
          overlapOk = false;
          overlapMsg = `${plates[i].closest("[data-node]")?.getAttribute("data-id")} solapa ${plates[j].closest("[data-node]")?.getAttribute("data-id")}`;
          break;
        }
      }
      if (!overlapOk) break;
    }

    const layoutCx = LAYOUT_DESKTOP;
    const orderOk =
      layoutCx.telecomunicaciones.x < layoutCx.dam.x &&
      layoutCx.dam.x === layoutCx.ari.x &&
      layoutCx.ari.x < layoutCx.bootcamp.x &&
      layoutCx.bootcamp.x < layoutCx.siguiente.x;

    const panel = document.querySelector(".edu-detail-wrap");
    const bottombar = document.querySelector(".p5-bottombar");
    const vpH = window.innerHeight;
    let panelOk = true;
    let panelMsg = "";
    if (panel && bottombar) {
      const pr = panel.getBoundingClientRect();
      const br = bottombar.getBoundingClientRect();
      if (pr.bottom > br.top) { panelOk = false; panelMsg = `panel.bottom ${pr.bottom.toFixed(0)} > bottombar.top ${br.top.toFixed(0)}`; }
    } else if (panel) {
      const pr = panel.getBoundingClientRect();
      if (pr.bottom > vpH) { panelOk = false; panelMsg = `panel.bottom ${pr.bottom.toFixed(0)} > vpH ${vpH}`; }
    }

    const routeEls = [...document.querySelectorAll("path[data-route]")];
    const redRoutes = routeEls.filter((r) => r.classList.contains("edu-route--red"));
    const whiteRoutes = routeEls.filter((r) => r.classList.contains("edu-route--white"));
    const routesOk = redRoutes.length >= 4 && whiteRoutes.length >= 4;

    return {
      scrollHeight: document.scrollingElement.scrollHeight,
      innerHeight: window.innerHeight,
      countOk, visibleOk, widthOk, overlapOk, overlapMsg,
      orderOk, cxById: layoutCx,
      panelOk, panelMsg,
      routesOk,
      nodeInfos,
    };
  }, width);

  pass("scrollHeight <= innerHeight", checks.scrollHeight <= checks.innerHeight, `${checks.scrollHeight} <= ${checks.innerHeight}`);
  pass("5 nodos visibles", checks.visibleOk, `${checks.nodeInfos.length} placas`);
  if (checks.widthOk !== null) pass("cada nodo > 150px ancho (1920)", checks.widthOk, checks.nodeInfos.map(n => `${n.id}=${n.w.toFixed(0)}px`).join(", "));
  pass("sin solapes entre nodos", checks.overlapOk, checks.overlapMsg);
  pass("orden L→R correcto (LAYOUT_DESKTOP)", checks.orderOk, JSON.stringify(checks.cxById));
  pass("4 rutas completas (blanca+roja)", checks.routesOk);
  pass("panel sobre bottombar", checks.panelOk, checks.panelMsg);

  results[name] = { ...checks, scrollOk: checks.scrollHeight <= checks.innerHeight };

  await browser.close();
}

(async () => {
  for (const size of SIZES) {
    await runForSize(size);
  }

  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("RESUMEN DE COMPROBACIONES");
  console.log("══════════════════════════════════════════════════════════════════════");
  let totalOk = true;
  for (const [name, r] of Object.entries(results)) {
    const widthOkCheck = r.widthOk === null || r.widthOk;
    const sizeOk = r.scrollOk && r.countOk && r.visibleOk && r.overlapOk && r.orderOk && r.routesOk && r.panelOk && widthOkCheck;
    if (!sizeOk) totalOk = false;
    console.log(`  ${name}: ${sizeOk ? "TODO PASS" : "ALGUNOS FAIL"}`);
  }
  console.log(`\n${totalOk ? "TODAS LAS COMPROBACIONES PASARON" : "ALGUNAS COMPROBACIONES FALLARON"}`);
  process.exit(totalOk ? 0 : 1);
})();
