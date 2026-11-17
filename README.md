# Mario Muñoz Pequeño — Portfolio

Portfolio personal e interactivo con estetica inspirada en Persona 5. Desarrollador de aplicaciones en Valladolid, España.

🔗 Demo: https://mariomunpeq.is-a.dev/

## Capturas

Capturas generadas con Playwright contra `pnpm preview` (documentacion y buscadores).

| Pagina | Captura |
|--------|---------|
| Inicio | ![Home](./docs/screenshots/home.webp) |
| Perfil | ![About](./docs/screenshots/about.webp) |
| Inventario | ![Projects](./docs/screenshots/projects.webp) |
| Progreso | ![Experience](./docs/screenshots/experience.webp) |
| Formacion | ![Education](./docs/screenshots/education.webp) |
| 404 | ![NotFound](./docs/screenshots/notfound.webp) |

## Que incluye

El sitio es un portfolio / "CV viviente" con las siguientes secciones y caracteristicas:

- **Perfil**: informacion personal, biografia, habilidades (Social Stats al estilo Persona 5), permiso de conducir y escena de conduccion.
- **Inventario**: listado de proyectos con selector por filas y vista previa de cada uno.
- **Progreso**: experiencia laboral presentada como conversacion con burbujas, avatares de empresa y sellos de lectura.
- **Habilidades**: formacion academica en arbol de habilidades tipo sistema de juego, con nodos, rutas y panel de detalle.
- **Fichas de proyecto**: detalle de cada proyecto con galeria, stack, features, rol, retos y enlaces.
- **Musica**: reproductor de fondo integrado con 5 pistas, ecualizador y vinilo animado.
- **Cursor personalizado**: reticulo contextual con etiquetas (se desactiva en tactil o con reduced motion).
- **Transiciones de ruta**: transicion de video (tren) y fundido a negro entre secciones.
- **Calendario de carga**: pantalla de introduccion tipo calendario con caida de fechas y cuchillo.
- **Reloj digital** en la barra inferior con enlaces sociales.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS, GSAP, Lenis, Motion, React Router, Playwright, oxlint.

## Como ejecutarlo

Requisitos: Node.js y pnpm.

```bash
# Instalar dependencias
pnpm install

# Entorno de desarrollo (Vite)
pnpm dev

# Build de produccion (TypeScript + Vite + prerrender de metadatos)
pnpm build

# Previsualizar el build
pnpm preview

# Comprobacion de tipos
pnpm typecheck

# Lint
pnpm lint

# Formato
pnpm format
pnpm format:check
```

## Estructura de carpetas

```
src/            Codigo fuente de la aplicacion
  components/   Componentes React reutilizables
  pages/        Paginas de ruta (Home, About, Projects, Experience, Education, ProjectDetail, NotFound)
  data/         Datos estaticos (proyectos, perfil, experiencia, formacion, musica, metadatos SEO)
  lib/          Utilidades (boot, media query, calendario, logos de empresa)
  styles/       Tokens de estilo (tipografia, colores, utilidades Tailwind)
  transition/   Componentes de transicion de ruta y pantalla de carga
public/         Assets estaticos (imagenes, videos, fuentes, audio, OG, manifest)
scripts/        Scripts de build (prerender de metadatos por ruta)
tests/          Pruebas de Playwright
dist/           Salida del build de produccion
```

## Rendimiento y SEO

- **Code splitting**: las rutas pesadas (`/education` y `/proyectos/:slug`) se cargan con `React.lazy` + `Suspense`; el vendor se separa en chunks (`vendor-react`, `vendor-gsap`, `vendor-motion`, `vendor`).
- **Fuentes autoalojadas**: Anton, Space Grotesk, Caveat y Share Tech Mono en WOFF2 con `font-display: swap`; eliminada la peticion render-bloqueante a Google Fonts.
- **Imagenes WebP**: capturas de proyecto convertidas a WebP; `loading="lazy"` y `decoding="async"` en capturas no criticas; `width`/`height` para evitar saltos de layout (CLS).
- **Prerender de metadatos**: titulo, descripcion, canonical, Open Graph y Twitter generados por ruta durante el build (`scripts/prerender-metadata.mjs`).
- **Sitemap y robots.txt**: `sitemap.xml` con las 12 rutas indexables y `robots.txt` permitiendo rastreo.
- **404**: ruta `/404` + `*` con pagina `404.html` generada en el prerrender.
- **JSON-LD**: esquema `Person` con nombre, rol, descripcion, URL, imagen, enlaces sociales y direccion.

## Despliegue

Despliegue automatico en GitHub Pages mediante el workflow `.github/workflows/deploy.yml` (despliega en push a `main` usando `actions/deploy-pages@v4`).

Mario Muñoz Pequeño · Desarrollador de aplicaciones · Valladolid, España
