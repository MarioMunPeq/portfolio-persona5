import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import routeMetadata from "../../data/route-metadata.json";

const SITE_URL = "https://mariomunpeq.is-a.dev";
const SITE_NAME = "Mario Muñoz Pequeño";
const DEFAULT_DESCRIPTION =
  "Desarrollador de aplicaciones en Valladolid. Descubre mis proyectos, experiencia profesional y formacion.";

interface PageMetadata {
  title: string;
  description: string;
  indexable: boolean;
}

const defaultMetadata: PageMetadata = {
  title: `Pagina no encontrada — ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  indexable: false,
};

function updateMeta(
  attribute: "name" | "property",
  key: string,
  value: string,
) {
  const element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (element) element.content = value;
}

export function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    const metadata =
      Object.entries(routeMetadata).find(
        ([route]) => route === normalizedPath,
      )?.[1] ?? defaultMetadata;
    const canonicalUrl = new URL(normalizedPath, SITE_URL).href;

    document.title = metadata.title;
    updateMeta("name", "description", metadata.description);
    updateMeta(
      "name",
      "robots",
      metadata.indexable
        ? "index, follow, max-image-preview:large"
        : "noindex, follow",
    );
    updateMeta("property", "og:title", metadata.title);
    updateMeta("property", "og:description", metadata.description);
    updateMeta("property", "og:url", canonicalUrl);
    updateMeta("name", "twitter:title", metadata.title);
    updateMeta("name", "twitter:description", metadata.description);

    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical) canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
