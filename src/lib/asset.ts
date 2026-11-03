/**
 * Resuelve la ruta de un asset servido desde `public/` respetando la base
 * real del despliegue (`import.meta.env.BASE_URL`).
 *
 * Por que existe: parte del codigo construia las URLs a mano con una
 * barra inicial (`/images/...`), lo que funciona solo mientras el sitio
 * se sirva en la raiz del dominio. Con el repo servido bajo
 * `github.io/<repo>/` esas URLs apuntan fuera del proyecto y se rompen
 * en silencio (no hay error, solo un 404 de imagen). Pasar todo por aqui
 * hace que cambiar `base` en vite.config.ts no rompa nada.
 *
 *   asset("images/retrato.png")        → "/images/retrato.png"
 *   asset("/images/retrato.png")       → "/images/retrato.png"  (idempotente)
 *   asset("videos/x.webm", "BASE_URL") → base + "videos/x.webm"
 */
export function asset(
  path: string,
  base: string = import.meta.env.BASE_URL,
): string {
  const clean = path.replace(/^\/+/, "");
  return `${base.replace(/\/+$/, "")}/${clean}`;
}
