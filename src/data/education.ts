/* ═════════════════════════════════════════════════════════════════════════════════
   Ruta de formacion — Habilidades (pagina /education)
   Datos reales de las certificaciones (PDFs en public/certifications).
   Los previews de pagina se generan en public/previews/<slug>-<n>.webp.
   ═════════════════════════════════════════════════════════════════════════════════ */

export type EduCategory = "ESTUDIOS" | "BOOTCAMP" | "IDIOMAS" | "PRL";

export interface EduDocument {
  /** Clave del documento y de sus previews de pagina. */
  slug: string;
  /** Titulo completo del certificado. */
  title: string;
  /** Titulo corto de la placa. */
  shortTitle: string;
  /** Entidad emisora. */
  entity: string;
  /** Fecha de expedicion, formato legible (es-ES). */
  date: string;
  /** Fecha ISO para ordenacion y calculo de "novedad". */
  dateISO: string;
  /** Horas lectivas (null si no aplica). */
  hours: number | null;
  /** Ruta publica del PDF. */
  file: string;
  /** Categoria para el kicker del panel y la etiqueta de fila. */
  category: EduCategory;
  /** Numero romano cronologico del documento (I = mas antiguo … VII = mas reciente). */
  roman: string;
  /** Arcano del tarot asociado: su nombre se imprime en la carta y su numero
     romano es el que se muestra en placas, carta superior y visor. */
  arcana: { name: string; number: string };
  /** Nº de paginas renderizadas (se rellena al generar previews). */
  pages: number;
}

/** Fecha de referencia del entorno para calcular la etiqueta "NEW!"
   (< 60 dias). Coincide con los dos certificados PRL de septiembre/
   octubre de 2026 y con ninguno de los demas. */
export const REF_TODAY_ISO = "2026-11-13";

export function isNew(dateISO: string): boolean {
  const ref = new Date(REF_TODAY_ISO);
  ref.setHours(0, 0, 0, 0);
  const day = new Date(dateISO);
  day.setHours(0, 0, 0, 0);
  const diffDays = (ref.getTime() - day.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 60;
}

export const EDU_DOCUMENTS: EduDocument[] = [
  {
    slug: "eso-graduado",
    title: "Titulo de Graduado en ESO",
    shortTitle: "ESO",
    entity: "Junta de Castilla y Leon",
    date: "16 nov 2018",
    dateISO: "2018-11-16",
    hours: null,
    file: "certifications/estudios/eso-titulo-graduado.pdf",
    category: "ESTUDIOS",
    roman: "I",
    arcana: { name: "LE MAT", number: "0" },
    pages: 1,
  },
  {
    slug: "telecomunicaciones",
    title: "Tecnico en Instalaciones de Telecomunicaciones",
    shortTitle: "TELECO",
    entity: "IES La Merced",
    date: "06 jun 2022",
    dateISO: "2022-06-06",
    hours: null,
    file: "certifications/estudios/cfgm-instalaciones-telecomunicaciones.pdf",
    category: "ESTUDIOS",
    roman: "II",
    arcana: { name: "LE BATELEUR", number: "I" },
    pages: 1,
  },
  {
    slug: "desarrollo-aplicaciones-multiplataforma",
    title: "Tecnico Superior en Desarrollo de Aplicaciones Multiplataforma",
    shortTitle: "DAM",
    entity: "IES Julian Marias",
    date: "03 jun 2024",
    dateISO: "2024-06-03",
    hours: null,
    file: "certifications/estudios/cfgs-desarrollo-aplicaciones-multiplataforma.pdf",
    category: "ESTUDIOS",
    roman: "III",
    arcana: { name: "L'EMPEREUR", number: "IV" },
    pages: 1,
  },
  {
    slug: "bootcamp-ia",
    title: "Bootcamp de Inteligencia Artificial",
    shortTitle: "BOOTCAMP IA",
    entity: "Qualentum · Vass University",
    date: "20 mar 2025",
    dateISO: "2025-03-20",
    hours: null,
    file: "certifications/ia/bootcamp-inteligencia-artificial.pdf",
    category: "BOOTCAMP",
    roman: "IV",
    arcana: { name: "L'ETOILE", number: "XVII" },
    pages: 2,
  },
  {
    slug: "ingles-b2",
    title: "Trinity ISE II — Ingles B2",
    shortTitle: "INGLES B2",
    entity: "Trinity College London",
    date: "oct 2025",
    dateISO: "2025-10-01",
    hours: null,
    file: "certifications/idiomas/trinity-ise-ii-b2.pdf",
    category: "IDIOMAS",
    roman: "V",
    arcana: { name: "LE MONDE", number: "XXI" },
    pages: 1,
  },
  {
    slug: "prl-safety-telework",
    title: "Safety & Telework",
    shortTitle: "SAFETY & TELEWORK",
    entity: "ASPY Prevencion",
    date: "1 oct 2026",
    dateISO: "2026-10-01",
    hours: 3,
    file: "certifications/prl/health-and-safety-during-teleworking.pdf",
    category: "PRL",
    roman: "VI",
    arcana: { name: "LA JUSTICE", number: "VIII" },
    pages: 2,
  },
  {
    slug: "prl-consultant",
    title: "PRL · Consultant",
    shortTitle: "PRL CONSULTANT",
    entity: "ASPY Prevencion",
    date: "25 sep 2026",
    dateISO: "2026-09-25",
    hours: 2,
    file: "certifications/prl/prl-recurso-preventivo.pdf",
    category: "PRL",
    roman: "VII",
    arcana: { name: "L'HERMITE", number: "IX" },
    pages: 2,
  },
];

export const DOC_BY_SLUG = new Map(
  EDU_DOCUMENTS.map((d) => [d.slug, d]),
);

export interface EduNode {
  id: string;
  /** Etiqueta corta del nodo (ESO, TELECO…). */
  shortTitle: string;
  /** Titulo completo (comic). */
  title: string;
  /** Tipo de formacion (sans mayusculas). */
  type: string;
  status: "completed" | "locked";
  period: string;
  center: string;
  /** Año del titulo (se muestra en el nodo y como cifra si no hay horas). */
  year: number | null;
  /** Fecha del titulo, formato legible. */
  dateTitle: string;
  /** Horas del nodo (cifra grande si hay; si no, el año). */
  hours: number | null;
  icon: "cap" | "antenna" | "robot" | "code" | "chip" | "question";
  category: EduCategory | null;
  /** Nodos previos requeridos. */
  requires: string[];
  documents: EduDocument[];
  /** Nota destacada (p. ej. mencion honorifica en el TFG). */
  detail?: string;
}

export const EDU_TREE: { nodes: EduNode[]; edges: EduEdge[] } = {
  nodes: [
    {
      id: "eso",
      shortTitle: "ESO",
      title: "Graduado en ESO",
      type: "ESO",
      status: "completed",
      period: "—",
      center: "Junta de Castilla y Leon",
      year: 2018,
      dateTitle: "16 nov 2018",
      hours: null,
      icon: "cap",
      category: "ESTUDIOS",
      requires: [],
      documents: [EDU_DOCUMENTS[0]],
    },
    {
      id: "telecomunicaciones",
      shortTitle: "TELECO",
      title: "Tecnico en Instalaciones de Telecomunicaciones",
      type: "Grado Medio",
      status: "completed",
      period: "Septiembre 2018 — Junio 2020",
      center: "IES La Merced",
      year: 2022,
      dateTitle: "06 jun 2022",
      hours: null,
      icon: "antenna",
      category: "ESTUDIOS",
      requires: ["eso"],
      documents: [EDU_DOCUMENTS[1]],
    },
    {
      id: "ari",
      shortTitle: "ROBOTICA",
      title: "Automatizacion y robotica Industrial",
      type: "Grado Superior",
      status: "completed",
      period: "Septiembre 2020 — Junio 2022",
      center: "IES Galileo",
      year: 2022,
      dateTitle: "2022",
      hours: null,
      icon: "robot",
      category: "ESTUDIOS",
      requires: ["telecomunicaciones"],
      documents: [],
    },
    {
      id: "dam",
      shortTitle: "DAM",
      title: "Tecnico Superior en DAM",
      type: "Grado Superior",
      status: "completed",
      period: "Septiembre 2022 — Junio 2024",
      center: "IES Julian Marias",
      year: 2024,
      dateTitle: "03 jun 2024",
      hours: null,
      icon: "code",
      category: "ESTUDIOS",
      detail: "Mencion honorifica en el TFG",
      requires: ["telecomunicaciones"],
      documents: [EDU_DOCUMENTS[2]],
    },
    {
      id: "bootcamp",
      shortTitle: "BOOTCAMP IA",
      title: "Bootcamp de Inteligencia Artificial",
      type: "Bootcamp",
      status: "completed",
      period: "jun 2024 — ene 2025",
      center: "Qualentum · Vass University",
      year: 2025,
      dateTitle: "20 mar 2025",
      hours: 450,
      icon: "chip",
      category: "BOOTCAMP",
      requires: ["dam"],
      documents: [EDU_DOCUMENTS[3]],
    },
    {
      id: "ingles",
      shortTitle: "INGLES B2",
      title: "Ingles B2",
      type: "Idiomas",
      status: "completed",
      period: "—",
      center: "Trinity College London",
      year: 2025,
      dateTitle: "oct 2025",
      hours: null,
      icon: "cap",
      category: "IDIOMAS",
      requires: ["bootcamp"],
      documents: [EDU_DOCUMENTS[4]],
    },
    {
      id: "prl",
      shortTitle: "PRL",
      title: "Prevencion de Riesgos Laborales",
      type: "PRL",
      status: "completed",
      period: "sep — oct 2026",
      center: "ASPY Prevencion",
      year: 2026,
      dateTitle: "25 sep 2026 — 1 oct 2026",
      hours: 5,
      icon: "cap",
      category: "PRL",
      requires: ["ingles"],
      documents: [EDU_DOCUMENTS[5], EDU_DOCUMENTS[6]],
    },
    {
      id: "siguiente",
      shortTitle: "??",
      title: "?",
      type: "?",
      status: "locked",
      period: "",
      center: "",
      year: null,
      dateTitle: "—",
      hours: null,
      icon: "question",
      category: null,
      requires: ["prl"],
      documents: [],
    },
  ],
  edges: [
    { from: "eso", to: "telecomunicaciones" },
    { from: "telecomunicaciones", to: "ari" },
    { from: "telecomunicaciones", to: "dam" },
    { from: "dam", to: "bootcamp" },
    { from: "bootcamp", to: "ingles" },
    { from: "ingles", to: "prl" },
    { from: "prl", to: "siguiente" },
  ],
};

export interface EduEdge {
  from: string;
  to: string;
}

export function completedCount(): number {
  return EDU_TREE.nodes.filter((n) => n.status === "completed").length;
}

export function totalCount(): number {
  return EDU_TREE.nodes.length;
}

export function findNode(id: string): EduNode | undefined {
  return EDU_TREE.nodes.find((n) => n.id === id);
}

export function unlockedIds(): string[] {
  return EDU_TREE.nodes
    .filter((n) => n.status === "completed")
    .map((n) => n.id);
}

export function isUnlocked(id: string): boolean {
  const node = findNode(id);
  if (!node) return false;
  if (node.status === "completed") return true;
  return node.requires.every((r) => unlockedIds().includes(r));
}

export function lastUnlockedId(): string {
  const unlocked = unlockedIds();
  const mainPath = ["eso", "telecomunicaciones", "dam", "bootcamp", "ingles", "prl"];
  for (let i = mainPath.length - 1; i >= 0; i--) {
    if (unlocked.includes(mainPath[i])) return mainPath[i];
  }
  return unlocked[0] ?? EDU_TREE.nodes[0]!.id;
}

/** Ruta principal ordenada (para el progreso y la navegacion por teclado).
   Incluye Robotica tras Teleco, tal como esta en el expediente. */
export const ROUTE_ORDER: string[] = [
  "eso",
  "telecomunicaciones",
  "ari",
  "dam",
  "bootcamp",
  "ingles",
  "prl",
  "siguiente",
];

/** Nodos con al menos un documento, ordenados por fecha descendente (lista rapida). */
export const DOCUMENTS_BY_DATE_DESC: EduDocument[] = [...EDU_DOCUMENTS].sort(
  (a, b) => b.dateISO.localeCompare(a.dateISO),
);
