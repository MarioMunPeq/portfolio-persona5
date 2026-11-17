/* ════════════════════════════════════════════════════════════════════════════════════
   check:assets — Verifica que los assets Persona 5 de /education existen en
   public/assets/persona/. Imprime los que faltan y sale con codigo distinto
   de cero si hay alguno ausente (sin fallar el build de Vite).
   ════════════════════════════════════════════════════════════════════════════════════ */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const PERSONA_ASSETS_DIR = "public/assets/persona";

/* Nombres fijos de los archivos esperados (identicos a src/config/personaAssets.ts). */
const ARCANA = {
  "0": "arcana-0-le-mat.webp",        /* ESO → Le Mat */
  "1": "arcana-1-le-bateleur.webp",   /* Teleco → Le Bateleur */
  "4": "arcana-4-l-empereur.webp",    /* DAM → L'Empereur */
  "17": "arcana-17-l-etoile.webp",    /* Bootcamp IA → L'Etoile */
  "21": "arcana-21-le-monde.webp",    /* Ingles B2 → Le Monde */
  "8": "arcana-8-la-justice.webp",    /* Safety & Telework → La Justice */
  "9": "arcana-9-l-hermite.webp",     /* PRL Consultant → L'Hermite */
};
const BTN = {
  square: "btn-square.webp",
  triangle: "btn-triangle.webp",
  cross: "btn-cross.webp",
  circle: "btn-circle.webp",
  l1: "btn-l1.webp",
  r1: "btn-r1.webp",
};
const TAG = {
  get: "tag-get.webp",
  new: "tag-new.webp",
  levelup: "tag-levelup.webp",
};
const LOADER = {
  hat: "loader-hat.webp",
  flames: "loader-flames.webp",
};

const root = resolve(process.cwd(), "..");
const dir = resolve(root, PERSONA_ASSETS_DIR);
const expected = [
  ...Object.values(ARCANA),
  "arcana-back.webp",
  ...Object.values(BTN),
  ...Object.values(TAG),
  ...Object.values(LOADER),
  "joker-think.webp",
  "bg-loading.webp",
];

const missing = expected.filter((name) => !existsSync(resolve(dir, name)));

if (missing.length === 0) {
  console.log(`[check:assets] OK — todos los ${expected.length} assets estan en ${PERSONA_ASSETS_DIR}/`);
  process.exit(0);
}

console.log(`[check:assets] Faltan ${missing.length} de ${expected.length} assets en ${PERSONA_ASSETS_DIR}/:`);
for (const name of missing) {
  console.log(`  - ${name}`);
}
console.log(
  "La pagina usa fallbacks CSS limpios para los assets ausentes (placa con el numero romano, rombo rojo, pastillas L1/R1…).",
);
process.exit(missing.length);
