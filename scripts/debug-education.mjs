import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://localhost:5173/education", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.mouse.click(960, 540);
await page.waitForTimeout(1800);
const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const rect = (s) => {
    const el = q(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      display: cs.display,
      position: cs.position,
      zIndex: cs.zIndex,
      opacity: cs.opacity,
      visibility: cs.visibility,
      transform: cs.transform,
      background: cs.backgroundColor,
      clip: cs.clipPath,
    };
  };
  return {
    bodyClass: document.body.className,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    main: rect("#main"),
    screen: rect(".education-screen"),
    stage: rect(".edu-stage"),
    grid: rect(".edu-grid"),
    card: rect(".edu-node-card"),
    layer: rect(".edu-node-layer"),
    fill: rect(".edu-node-layer--fill"),
    inner: rect(".edu-node-inner"),
    topbar: rect(".p5-topbar"),
    bottombar: rect(".p5-bottombar"),
    panel: rect(".edu-detail-wrap"),
    header: rect(".edu-header"),
    wraps: [...document.querySelectorAll(".edu-wrap")].map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className, x: r.x, y: r.y, w: r.width, h: r.height };
    }),
    layers: [...document.querySelectorAll(".edu-node-card:first-of-type .edu-node-layer")].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { cls: el.className, x: r.x, y: r.y, w: r.width, h: r.height, bg: cs.backgroundColor, pos: cs.position, inset: cs.inset, clip: cs.clipPath };
    }),
    html: document.querySelector(".education-screen")?.innerHTML.slice(0, 500),
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "C:/tmp/edu-debug.png", fullPage: false });
await browser.close();
