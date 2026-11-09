import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
for (const [w, h] of [[1920, 1080], [1366, 768], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto("http://localhost:5173/education", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.mouse.click(w / 2, h / 2);
  await page.waitForTimeout(1500);
  await page.mouse.move(2, 2);
  const info = await page.evaluate(() => {
    const r = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom) };
    };
    return {
      vh: innerHeight,
      scrollH: document.documentElement.scrollHeight,
      header: r(".edu-header"),
      grid: r(".edu-grid"),
      stage: r(".edu-stage"),
      panel: r(".edu-detail-wrap"),
      panelInner: r(".edu-detail-inner"),
      topbarLeft: r(".p5-topbar-left"),
      bottombar: r(".p5-bottombar"),
      main: r("#main"),
      treeCol: r(".edu-tree-col"),
      panelCol: r(".edu-panel-col"),
      wraps: [...document.querySelectorAll(".edu-wrap")].map((el) => {
        const b = el.getBoundingClientRect();
        return { cls: el.className.replace("edu-wrap ", ""), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom) };
      }),
    };
  });
  console.log(`\n=== ${w}x${h} ===`);
  console.log(JSON.stringify(info, null, 1));
  await page.close();
}
await browser.close();
