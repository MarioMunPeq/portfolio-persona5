import type { Project } from "../data/projects";

/**
 * Galerias de proyecto construidas desde el sistema de archivos.
 *
 * Colocar las capturas en `src/assets/projects/<slug>/` basta para que
 * aparezcan: se recogen aqui por `import.meta.glob` y se ordenan, de
 * modo que anadir o quitar un archivo no obliga a tocar los datos. Es
 * el criterio de la filosofia del proyecto — un proyecto nuevo debe
 * requerir un cambio de datos, no de codigo — invertido aqui a proposito:
 * la propia carpeta de imagenes ES el dato.
 *
 * Reglas:
 *   - La portada es el archivo que empieza por "1" (1.png, 1.webp...).
 *     Si no existe, se usa el primero en orden alfabetico.
 *   - El resto entra en la galeria en orden alfabetico, sin repetir la
 *     portada.
 *   - Se aceptan png, webp, jpg y avif, para poder cambiar de formato
 *     despues sin tocar nada.
 *   - Se ordena con collation numerico: 2 va antes que 10.
 *
 * Los proyectos que aun declaran sus capturas a mano en `data/projects.ts`
 * (y no tienen carpeta en src/assets) siguen usando esas listas: la
 * galeria automatica no pisa nada, solo rellena lo que encuentra.
 */

/**
 * OJO: el patron de `import.meta.glob` tiene que ser un literal de cadena
 * plano. Vite lo resuelve en tiempo de construccion y no ejecuta el
 * modulo, asi que si el patron se construye con una variable
 * interpolada no llega a evaluarse: el glob devuelve un objeto vacio y
 * las capturas desaparecen sin ningun error ni aviso. Por eso la lista
 * de extensiones va escrita aqui, en linea, y no en una constante.
 */
const mediaBySlug = import.meta.glob<{ default: string }>(
  "../assets/projects/*/*.{png,webp,jpg,avif}",
  { eager: true, query: "?url", import: "default" },
);

/** "../assets/projects/foo/2.png" -> { slug: "foo", file: "2.png" } */
function parseKey(key: string): { slug: string; file: string } {
  const parts = key.split("/");
  return {
    file: parts[parts.length - 1] ?? "",
    slug: parts[parts.length - 2] ?? "",
  };
}

/** Orden natural: los numeros se comparan como numeros, no como texto. */
const collator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

/** Imagenes de un proyecto con su nombre de archivo, ya ordenadas. */
function filesFor(slug: string): { file: string; url: string }[] {
  return Object.entries(mediaBySlug)
    .filter(([key]) => parseKey(key).slug === slug)
    .map(([key, mod]) => ({ file: parseKey(key).file, url: mod.default }))
    .sort((a, b) => collator.compare(a.file, b.file));
}

/** El archivo "1.*" es la portada. */
function isCover(file: string): boolean {
  return /^1\./i.test(file);
}

/**
 * El nombre del archivo hace de pie de foto: "mapa.png" -> "Mapa",
 * "detalles-proyecto.png" -> "Detalles Proyecto". La portada ("1.*") se
 * queda sin pie, que es donde va el bloque de texto de la ficha.
 */
function captionFrom(file: string): string | undefined {
  if (isCover(file)) return undefined;
  const base = file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!base) return undefined;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Resuelve las imagenes de cada proyecto que tenga carpeta en
 * src/assets. Los que no la tienen conservan las capturas declaradas a
 * mano en `data/projects.ts`.
 */
export function withProjectMedia(list: Project[]): Project[] {
  return list.map((project) => {
    const files = filesFor(project.slug);
    if (files.length === 0) return project;

    const primary = files.find((f) => isCover(f.file)) ?? files[0];
    if (!primary) return project;

    const rest = files.filter((f) => f.url !== primary.url);
    const coverAlt = project.images?.[0]?.alt ?? `Captura de ${project.name}`;

    return {
      ...project,
      images: [{ src: primary.url, alt: coverAlt }],
      screenshots: [
        { src: primary.url, alt: coverAlt, caption: undefined },
        ...rest.map((f) => ({
          src: f.url,
          alt: `Captura de ${project.name}`,
          caption: captionFrom(f.file),
        })),
      ],
    };
  });
}
