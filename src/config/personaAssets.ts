/* ════════════════════════════════════════════════════════════════════════════════════
   Assets Persona 5 de la ruta /education.
   Los archivos originales van en public/assets/persona/ (no se publican desde
   assets-src/). Si falta un archivo, la pagina usa un fallback CSS limpio
   (placa con el numero romano, rombo rojo, pastillas L1/R1…), nunca un
   recuadro negro vacio.
   ════════════════════════════════════════════════════════════════════════════════════ */

export const PERSONA_ASSETS_DIR = "public/assets/persona";

/* Nombres fijos de los archivos esperados. */
export const PERSONA_ASSETS = {
  /* Arcanos (una imagen por arcano). Se usa en la minicarta de la placa y en
     el sello de la carta. La clave es el numero romano del arcano. */
  arcana: {
    "0": "arcana-0-le-mat.webp",        /* ESO → Le Mat */
    "1": "arcana-1-le-bateleur.webp",   /* Teleco → Le Bateleur */
    "4": "arcana-4-l-empereur.webp",    /* DAM → L'Empereur */
    "17": "arcana-17-l-etoile.webp",    /* Bootcamp IA → L'Etoile */
    "21": "arcana-21-le-monde.webp",    /* Ingles B2 → Le Monde */
    "8": "arcana-8-la-justice.webp",    /* Safety & Telework → La Justice */
    "9": "arcana-9-l-hermite.webp",     /* PRL Consultant → L'Hermite */
  },
  arcanaBack: "arcana-back.webp",       /* reverso de carta de tarot */
  /* Botones de mando (mismo set que GitHub/LinkedIn). */
  btn: {
    square: "btn-square.webp",   /* [□] */
    triangle: "btn-triangle.webp", /* [△] */
    cross: "btn-cross.webp",     /* [✕] */
    circle: "btn-circle.webp",   /* [○] */
    l1: "btn-l1.webp",           /* L1 */
    r1: "btn-r1.webp",           /* R1 */
  },
  /* Etiquetas de estado. */
  tag: {
    get: "tag-get.webp",     /* GET! al descargar */
    new: "tag-new.webp",     /* NEW! (< 60 dias) */
    levelup: "tag-levelup.webp", /* LEVEL UP! (una vez por sesion) */
  },
  /* Indicador de carga del visor: tira horizontal de 10 frames del mismo
     tamaño (steps(10), 0.8s en bucle). */
  loader: {
    hat: "loader-hat.webp",
    flames: "loader-flames.webp",
  },
  /* Opcionales. */
  joker: "joker-think.webp",      /* busto gris pensativo "Take your time" */
  bgLoading: "bg-loading.webp",   /* fondo del visor: blur 6px, opacity .14 */
} as const;

/* Ruta publica de un asset. */
export function assetPath(name: string): string {
  return `/${PERSONA_ASSETS_DIR}/${name}`;
}

/* Lista plana de todos los archivos esperados (para el script de verificacion). */
export function listExpectedAssets(): string[] {
  const out: string[] = [];
  for (const name of Object.values(PERSONA_ASSETS.arcana)) out.push(name);
  out.push(PERSONA_ASSETS.arcanaBack);
  for (const name of Object.values(PERSONA_ASSETS.btn)) out.push(name);
  for (const name of Object.values(PERSONA_ASSETS.tag)) out.push(name);
  for (const name of Object.values(PERSONA_ASSETS.loader)) out.push(name);
  out.push(PERSONA_ASSETS.joker);
  out.push(PERSONA_ASSETS.bgLoading);
  return out;
}
