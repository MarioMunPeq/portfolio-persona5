/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   /education — datos de los 7 documentos de formación (esqueleto).
   Importa los documentos existentes de src/data/education (no se duplican) y
   resuelve por cada uno: arcanaFile (sprite en public/images/ui/),
   isNew (fecha con menos de 60 días). Orden: más reciente primero.
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

import {
  DOCUMENTS_BY_DATE_DESC as BASE_DOCS,
  isNew,
  type EduDocument,
} from "../../data/education";
import { ARCANA_ASSETS } from "../../config/uiAssets";

const BASE = import.meta.env.BASE_URL;

/* Número romano del tarot → clave del sprite public/images/ui/arcana-<n>.webp.
   0 le-mat → ESO · 1 le-bateleur → Teleco · 4 l-empereur → DAM ·
   17 l-etoile → Bootcamp IA · 21 le-monde → Inglés B2 ·
   8 la-justice → Safety & Telework · 9 l-hermite → PRL Consultant */
const ROMAN_TO_ARABIC: Record<string, string> = {
  "0": "0",
  I: "1",
  IV: "4",
  VIII: "8",
  IX: "9",
  XVII: "17",
  XXI: "21",
};

export interface EducationDoc extends EduDocument {
  /** URL pública del sprite del arcano (public/images/ui/arcana-<n>.webp). */
  arcanaFile: string;
  /** ¿Novedad? Fecha del título con menos de 60 días (ref. 2026-11-13). */
  isNew: boolean;
}

/** 7 documentos, más reciente primero, con arcanaFile resuelto. */
export const EDUCATION_DOCS: EducationDoc[] = BASE_DOCS.map((doc) => {
  const arabic = ROMAN_TO_ARABIC[doc.arcana.number] ?? "0";
  const asset =
    ARCANA_ASSETS[arabic as keyof typeof ARCANA_ASSETS] ?? ARCANA_ASSETS["0"];
  return {
    ...doc,
    roman: doc.arcana.number,
    arcanaFile: asset.src,
    isNew: isNew(doc.dateISO),
  };
});

/** Mapa slug → documento. */
export const DOC_BY_SLUG = new Map(
  EDUCATION_DOCS.map((doc) => [doc.slug, doc]),
);

/** Total de documentos. */
export const DOCS_TOTAL = EDUCATION_DOCS.length;

export { isNew };
export type { EduDocument };

/** Comprueba si un slug es válido. */
export function isValidSlug(slug: string): boolean {
  return DOC_BY_SLUG.has(slug);
}

/** URL pública del PDF de un documento. */
export function pdfSrc(doc: EducationDoc): string {
  return `${BASE}${doc.file}`;
}
