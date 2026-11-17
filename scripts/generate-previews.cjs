/* Genera previews de página de los certificados PDF.
   Renderiza cada página con pdf.js dentro de Chromium (Playwright) sobre
   un canvas de 1600 px de ancho y la exporta a WebP en public/previews/.
   Máximo 6 páginas por documento. Se ejecuta una sola vez (build-time);
   no forma parte de npm run build. */
const http = require("node:http");
const { parse } = require("node:url");
const { join, resolve } = require("node:path");
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require("node:fs");
const { chromium } = require("playwright");

const root = resolve(__dirname, "..");
const publicDir = join(root, "public");
const outDir = join(publicDir, "previews");
mkdirSync(outDir, { recursive: true });

/* Documentos y sus PDFs (slug -> ruta dentro de public/). */
const DOCS = [
  { slug: "eso-graduado", pdf: "certifications/estudios/eso-titulo-graduado.pdf" },
  { slug: "telecomunicaciones", pdf: "certifications/estudios/cfgm-instalaciones-telecomunicaciones.pdf" },
  { slug: "desarrollo-aplicaciones-multiplataforma", pdf: "certifications/estudios/cfgs-desarrollo-aplicaciones-multiplataforma.pdf" },
  { slug: "bootcamp-ia", pdf: "certifications/ia/bootcamp-inteligencia-artificial.pdf" },
  { slug: "ingles-b2", pdf: "certifications/idiomas/trinity-ise-ii-b2.pdf" },
  { slug: "prl-safety-telework", pdf: "certifications/prl/health-and-safety-during-teleworking.pdf" },
  { slug: "prl-consultant", pdf: "certifications/prl/prl-recurso-preventivo.pdf" },
];

const TARGET_WIDTH = 1600;
const MAX_PAGES = 6;

/* Sirve public/ y node_modules/ (para pdf.js) desde memoria. */
const server = http.createServer((req, res) => {
  const url = parse(req.url);
  let file;
  if (url.pathname === "/__preview-harness") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(HARNESS);
  }
  if (url.pathname.startsWith("/node_modules/")) {
    file = join(root, url.pathname);
  } else {
    file = join(publicDir, url.pathname.slice(1) === "" ? "index.html" : url.pathname);
  }
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end("not found");
  }
  const ext = file.split(".").pop();
  const types = {
    js: "application/javascript",
    wasm: "application/wasm",
    pdf: "application/pdf",
    webp: "image/webp",
    png: "image/png",
    html: "text/html",
    css: "text/css",
    ico: "image/x-icon",
    svg: "image/svg+xml",
    woff2: "font/woff2",
    mjs: "text/javascript",
  };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  res.end(readFileSync(file));
});

const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><title>harness</title></head><body>
<script src="/node_modules/pdfjs-dist/legacy/build/pdf.mjs" type="module"></script>
<script type="module">
import * as pdfjsLib from "/node_modules/pdfjs-dist/legacy/build/pdf.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";
(async () => {
  const params = new URLSearchParams(location.search);
  const pdfUrl = new URL(params.get("pdf"), location.href).href;
  const results = { pages: [], error: null };
  const TARGET_WIDTH = 1600;
  const MAX_PAGES = 6;
  try {
    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
    loadingTask.promise.then(async (pdfDocument) => {
      const total = Math.min(pdfDocument.numPages, MAX_PAGES);
      for (let i = 1; i <= total; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const scale = TARGET_WIDTH / viewport.width;
        const renderViewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
        results.pages.push(canvas.toDataURL("image/webp", 0.92));
      }
      window.__previewResults = results;
    }).catch((e) => { results.error = String(e); window.__previewResults = results; });
  } catch (e) { results.error = String(e); window.__previewResults = results; }
})();
</script></body></html>`;

(async () => {
  await new Promise((r) => server.listen(5173, "127.0.0.1", r));
  console.log("servidor en http://127.0.0.1:5173");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2000, height: 2000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.stack ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[console error] ${m.text()}`);
  });

  const manifest = [];
  for (const doc of DOCS) {
    try {
      await page.goto(`http://127.0.0.1:5173/__preview-harness?pdf=${encodeURIComponent(doc.pdf)}`, {
        waitUntil: "domcontentloaded",
      });
      const data = await page.waitForFunction(() => window.__previewResults, { timeout: 60000 });
      const results = await data.jsonValue();
      if (results.error) throw new Error(results.error);
      const pages = results.pages;
      for (let i = 0; i < pages.length; i++) {
        const n = i + 1;
        const fileName = `${doc.slug}-${n}.webp`;
        const filePath = join(outDir, fileName);
        const base64 = pages[i].split(",")[1];
        writeFileSync(filePath, Buffer.from(base64, "base64"));
        manifest.push({ slug: doc.slug, page: n, width: TARGET_WIDTH, file: fileName });
        console.log(`OK ${fileName} (${Buffer.byteLength(base64, "base64")} bytes)`);
      }
      manifest.push({ slug: doc.slug, pages: pages.length });
    } catch (e) {
      console.error(`FALLO ${doc.slug}:`, e.message);
    }
  }

  await browser.close();
  server.close();

  const countBySlug = Object.fromEntries(manifest.filter((m) => m.pages !== undefined).map((m) => [m.slug, m.pages]));
  console.log("Páginas por documento:", countBySlug);
  console.log("errores:", errors);
  process.exit(errors.length ? 1 : 0);
})();
