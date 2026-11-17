/* ════════════════════════════════════════════════════════════════════════════════════
   Assets de UI de /education
   Las medidas naturales se leyeron de los archivos reales (PIL/identify) y se
   usan para limitar cada sprite a 1.25 × su altura natural. Nunca se amplia un
   sprite por encima de ese limite.
   ════════════════════════════════════════════════════════════════════════════════════ */

const BASE = import.meta.env.BASE_URL;

export interface UIAsset {
  /** Nombre del archivo dentro de public/images/ui. */
  file: string;
  /** URL publica lista para <img src>. */
  src: string;
  /** Ancho natural en pixeles. */
  width: number;
  /** Alto natural en pixeles. */
  height: number;
  /** Alto maximo permitido: 1.25 × alto natural. */
  maxHeight: number;
}

function uiAsset(file: string, width: number, height: number): UIAsset {
  return {
    file,
    src: `${BASE}images/ui/${file}`,
    width,
    height,
    maxHeight: Math.round(height * 1.25 * 100) / 100,
  };
}

/** Arcanos: todos los originales miden 250 × 450. */
export const ARCANA_ASSETS = {
  "0": uiAsset("arcana-0-le-mat.webp", 250, 450),
  "1": uiAsset("arcana-1-le-bateleur.webp", 250, 450),
  "4": uiAsset("arcana-4-l-empereur.webp", 250, 450),
  "8": uiAsset("arcana-8-la-justice.webp", 250, 450),
  "9": uiAsset("arcana-9-l-hermite.webp", 250, 450),
  "17": uiAsset("arcana-17-l-etoile.webp", 250, 450),
  "21": uiAsset("arcana-21-le-monde.webp", 250, 450),
} as const;

export const ARCANA_BACK = uiAsset("arcana-back.webp", 250, 450);

/** Botones de mando. L1/R1 no existen como archivo: se dibujan en CSS. */
export const BUTTON_ASSETS = {
  square: uiAsset("Button_Square.png", 50, 50),
  triangle: uiAsset("Button_Triangle.png", 50, 50),
  cross: uiAsset("Button_X.png", 50, 50),
  circle: uiAsset("Button_Circle.png", 50, 50),
  l3: uiAsset("Button_L3.png", 72, 49),
  r3: uiAsset("Button_R3.png", 62, 46),
} as const;

/** Etiquetas y sellos. */
export const TAG_ASSETS = {
  new: uiAsset("tag-new.webp", 90, 38),
  get: uiAsset("tag-get.webp", 119, 78),
  levelup: uiAsset("tag-levelup.webp", 242, 132),
} as const;

/** Indicadores de carga. La tira tiene 10 frames iguales (1330 / 10 = 133). */
export const LOADER_ASSETS = {
  hat: uiAsset("loader-hat.webp", 213, 219),
  flames: uiAsset("loader-flames.webp", 1330, 138),
} as const;

/** Asset opcional disponible en el proyecto (no se usa en esta pagina). */
export const TAKE_YOUR_TIME = uiAsset("take-your-time.webp", 447, 97);

/** Devuelve el asset del arcano a partir de su numero romano de tarot. */
export function arcanaAsset(roman: string): UIAsset {
  return ARCANA_ASSETS[roman as keyof typeof ARCANA_ASSETS] ?? ARCANA_ASSETS["0"];
}
