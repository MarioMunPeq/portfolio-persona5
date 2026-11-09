import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("console", (m) => console.log(`[PAGE] ${m.type()}: ${m.text()}`));

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  
  const buttons = await page.locator("button.hero-cmd").all();
  await buttons[3].click();
  
  await page.waitForFunction(() => {
    return document.documentElement.getAttribute("data-transition") === "done";
  }, { timeout: 15000 });
  
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector("#main");
    const section = document.querySelector(".education-screen");
    const grid = document.querySelector(".edu-grid");
    const header = document.querySelector(".edu-header");
    
    return {
      htmlScrollHeight: html.scrollHeight,
      htmlClientHeight: html.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      bodyClientHeight: body.clientHeight,
      mainScrollHeight: main?.scrollHeight,
      mainClientHeight: main?.clientHeight,
      sectionScrollHeight: section?.scrollHeight,
      sectionClientHeight: section?.clientHeight,
      gridScrollHeight: grid?.scrollHeight,
      gridClientHeight: grid?.clientHeight,
      headerOffsetHeight: header?.offsetHeight,
      headerH: getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
      bottombarH: getComputedStyle(document.documentElement).getPropertyValue("--bottombar-h"),
      mainStyle: main ? getComputedStyle(main).cssText.slice(0, 200) : "no main",
      sectionStyle: section ? getComputedStyle(section).cssText.slice(0, 200) : "no section",
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: "/tmp/edu-scroll.png", fullPage: true });
  
  await browser.close();
})();
