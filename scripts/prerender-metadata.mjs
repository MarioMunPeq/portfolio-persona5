import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://mariomunpeq.is-a.dev";
const distDirectory = join(root, "dist");
const metadata = JSON.parse(
  await readFile(join(root, "src", "data", "route-metadata.json"), "utf8"),
);
const sitemap = await readFile(join(root, "public", "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  ([, url]) => new URL(url),
);
const routes = new Set([
  ...sitemapUrls.map((url) => url.pathname.replace(/\/+$/, "") || "/"),
  ...Object.keys(metadata).filter((route) => route === "/404"),
]);

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceRequired(html, pattern, replacement, route, label) {
  if (!pattern.test(html)) {
    throw new Error(`Missing ${label} tag in generated HTML for ${route}`);
  }
  return html.replace(pattern, replacement);
}

function renderMetadata(template, route, pageMetadata) {
  const canonicalUrl = new URL(route, siteUrl).href;
  const title = escapeAttribute(pageMetadata.title);
  const description = escapeAttribute(pageMetadata.description);
  const robots = pageMetadata.indexable
    ? "index, follow, max-image-preview:large"
    : "noindex, follow";
  let html = template;

  html = replaceRequired(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${title}</title>`,
    route,
    "title",
  );
  html = replaceRequired(
    html,
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`,
    route,
    "description",
  );
  html = replaceRequired(
    html,
    /<meta\s+name="robots"[^>]*>/,
    `<meta name="robots" content="${robots}" />`,
    route,
    "robots",
  );
  html = replaceRequired(
    html,
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    route,
    "canonical",
  );

  for (const [attribute, key, content] of [
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", canonicalUrl],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
  ]) {
    const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`);
    html = replaceRequired(
      html,
      pattern,
      `<meta ${attribute}="${key}" content="${content}" />`,
      route,
      key,
    );
  }

  return html;
}

const template = await readFile(join(distDirectory, "index.html"), "utf8");
for (const route of routes) {
  const pageMetadata = metadata[route];
  if (!pageMetadata) {
    throw new Error(
      `No route metadata is configured for sitemap URL: ${route}`,
    );
  }

  const html = renderMetadata(template, route, pageMetadata);
  if (route === "/") {
    await writeFile(join(distDirectory, "index.html"), html);
    continue;
  }

  const outputPath = join(
    distDirectory,
    ...route.slice(1).split("/"),
    "index.html",
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

const notFoundPage = renderMetadata(template, "/404", metadata["/404"]);
await writeFile(join(distDirectory, "404.html"), notFoundPage);
console.log(
  `Generated static metadata for ${routes.size} routes and 404 fallback.`,
);
