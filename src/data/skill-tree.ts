// arbol de Habilidades — ruta academica real, de Grado Medio Telecomunicaciones
// a Bootcamp de IA. Centro, periodo, titulacion y horas proceden del CV.
// El nodo "?" es decorativo (etapa futura, camino en construccion).
// NO se inventan datos: todos los valores reflejan el expediente real.

export type EduStatus = "completed" | "locked";

export type SkillIconKind =
  | "cap"
  | "antenna"
  | "robot"
  | "code"
  | "chip"
  | "question";

export type SkillNodeKind = "unlocked" | "locked";

export interface SkillNode {
  id: string;
  /** Centro del nodo en % del contenedor del arbol. */
  x: number;
  y: number;
  /** Etiqueta corta bajo el nodo. */
  label: string;
  /** Titulo completo de la titulacion (panel de detalle). */
  title: string;
  icon: SkillIconKind;
  kind: SkillNodeKind;
  /** Texto del sello de estado del panel. */
  status: string;
  /** Nivel de la titulacion (Grado medio, Grado superior…). */
  level?: string;
  /** Nota destacada del expediente (TFG, horas…). */
  detail?: string;
  institution?: string;
  period?: string;
  description?: string;
}

export interface SkillEdge {
  from: string;
  to: string;
  /** solid = conexion real completada; future = trazo punteado decorativo. */
  kind: "solid" | "future";
}

export const SKILL_TREE: { nodes: SkillNode[]; edges: SkillEdge[] } = {
  nodes: [
    {
      id: "telecomunicaciones",
      x: 50,
      y: 85,
      label: "TELECO",
      title: "Instalaciones de Telecomunicaciones",
      icon: "antenna",
      kind: "unlocked",
      status: "Completado",
      level: "Grado medio",
      institution: "IES La Merced",
      period: "Septiembre 2018 — Junio 2020",
    },
    {
      id: "ari",
      x: 25,
      y: 52,
      label: "ROBOTICA",
      title: "Automatizacion y robotica Industrial",
      icon: "robot",
      kind: "unlocked",
      status: "Completado",
      level: "Grado superior",
      detail: "Sin TFG",
      institution: "IES Galileo",
      period: "Septiembre 2020 — Junio 2022",
    },
    {
      id: "dam",
      x: 75,
      y: 52,
      label: "DAM",
      title: "Desarrollo de Aplicaciones Multiplataforma",
      icon: "code",
      kind: "unlocked",
      status: "Completado",
      level: "Grado superior",
      detail: "mencion honorifica en el TFG",
      institution: "IES Julian Marias",
      period: "Septiembre 2022 — Junio 2024",
    },
    {
      id: "bootcamp",
      x: 75,
      y: 18,
      label: "BOOTCAMP IA",
      title: "Bootcamp de Inteligencia Artificial",
      icon: "chip",
      kind: "unlocked",
      status: "Completado",
      level: "Bootcamp",
      detail: "450 horas",
      institution: "Qualentum",
      period: "Junio 2024 — Enero 2025",
    },
    {
      id: "siguiente",
      x: 50,
      y: 18,
      label: "?",
      title: "Proxima etapa",
      icon: "question",
      kind: "locked",
      status: "En construccion",
    },
  ],
  edges: [
    { from: "telecomunicaciones", to: "ari", kind: "solid" },
    { from: "telecomunicaciones", to: "dam", kind: "solid" },
    { from: "dam", to: "bootcamp", kind: "solid" },
    { from: "bootcamp", to: "siguiente", kind: "future" },
  ],
};

export interface EduNode {
  id: string;
  /** Titulo de la titulacion. */
  title: string;
  /** Titulo corto para la etiqueta de nodo (p. ej. "BOOTCAMP IA"). */
  shortTitle?: string;
  /** Tipo de formacion (Grado Medio, Grado Superior, Bootcamp, ESO…). */
  type: string;
  /** Estado del nodo. */
  status: EduStatus;
  /** Periodo lectivo. */
  period: string;
  /** Centro educativo. */
  center: string;
  /** Horas lectivas (null si no aplica). */
  hours: number | null;
  /** Año de egreso / finalizacion (para mostrar en el nodo). */
  year?: number;
  /** Clave del icono (Font Awesome solido). */
  icon: SkillIconKind;
  /** Nodos previos requeridos para desbloquear este. */
  requires: string[];
}

export interface EduEdge {
  from: string;
  to: string;
}

export const EDU_TREE: { nodes: EduNode[]; edges: EduEdge[] } = {
  nodes: [
    {
      id: "telecomunicaciones",
      title: "Instalaciones de Telecomunicaciones",
      shortTitle: "TELECO",
      type: "Grado Medio",
      status: "completed",
      period: "Septiembre 2018 — Junio 2020",
      year: 2020,
      center: "IES La Merced",
      hours: null,
      icon: "antenna",
      requires: [],
    },
    {
      id: "ari",
      title: "Automatizacion y robotica industrial",
      shortTitle: "ROBOTICA",
      type: "Grado Superior",
      status: "completed",
      period: "Septiembre 2020 — Junio 2022",
      year: 2022,
      center: "IES Galileo",
      hours: null,
      icon: "robot",
      requires: ["telecomunicaciones"],
    },
    {
      id: "dam",
      title: "Desarrollo de Aplicaciones Multiplataforma",
      shortTitle: "DAM",
      type: "Grado Superior",
      status: "completed",
      period: "Septiembre 2022 — Junio 2024",
      year: 2024,
      center: "IES Julian Marias",
      hours: null,
      icon: "code",
      requires: ["telecomunicaciones"],
    },
    {
      id: "bootcamp",
      title: "Bootcamp de Inteligencia Artificial",
      shortTitle: "BOOTCAMP IA",
      type: "Bootcamp",
      status: "completed",
      period: "Junio 2024 — Enero 2025",
      year: 2025,
      center: "Qualentum",
      hours: 450,
      icon: "chip",
      requires: ["dam"],
    },
    {
      id: "siguiente",
      title: "?",
      type: "?",
      status: "locked",
      period: "",
      center: "",
      hours: null,
      icon: "question",
      requires: ["bootcamp"],
    },
  ],
  edges: [
    { from: "telecomunicaciones", to: "ari" },
    { from: "telecomunicaciones", to: "dam" },
    { from: "dam", to: "bootcamp" },
    { from: "bootcamp", to: "siguiente" },
  ],
};

/** Nodos completados (para el contador 04 / 05). */
export function completedCount(): number {
  return EDU_TREE.nodes.filter((n) => n.status === "completed").length;
}

/** Total de nodos del arbol. */
export function totalCount(): number {
  return EDU_TREE.nodes.length;
}

/** Devuelve el nodo por id. */
export function findNode(id: string): EduNode | undefined {
  return EDU_TREE.nodes.find((n) => n.id === id);
}

/** Devuelve los ids de los nodos desbloqueados (completados). */
export function unlockedIds(): string[] {
  return EDU_TREE.nodes
    .filter((n) => n.status === "completed")
    .map((n) => n.id);
}

/** Indica si un nodo esta desbloqueado (todos sus requisitos completados). */
export function isUnlocked(id: string): boolean {
  const node = findNode(id);
  if (!node) return false;
  if (node.status === "completed") return true;
  return node.requires.every((r) => unlockedIds().includes(r));
}

/** Ultimo nodo desbloqueado en la ruta principal (para preseleccionar). */
export function lastUnlockedId(): string {
  const unlocked = unlockedIds();
  // Ruta principal: telecomunicaciones -> dam -> bootcamp
  const mainPath = ["telecomunicaciones", "dam", "bootcamp"];
  for (let i = mainPath.length - 1; i >= 0; i--) {
    if (unlocked.includes(mainPath[i])) return mainPath[i];
  }
  return unlocked[0] ?? EDU_TREE.nodes[0]!.id;
}

/** Nodo mas cercano en una direccion dada (flechas del teclado). */
export function nearestNeighbor(
  id: string,
  dir: "up" | "down" | "left" | "right",
): string | undefined {
  const node = findNode(id);
  if (!node) return undefined;
  const cx = LAYOUT[node.id].x;
  const cy = LAYOUT[node.id].y;
  let best: EduNode | undefined;
  let bestDist = Infinity;

  for (const other of EDU_TREE.nodes) {
    if (other.id === id) continue;
    const ox = LAYOUT[other.id].x;
    const oy = LAYOUT[other.id].y;
    const dx = ox - cx;
    const dy = oy - cy;

    let matches = false;
    let score = 0;
    if (dir === "up" && dy < 0 && Math.abs(dy) >= Math.abs(dx)) {
      matches = true;
      score = Math.abs(dy) + Math.abs(dx) * 0.5;
    } else if (dir === "down" && dy > 0 && Math.abs(dy) >= Math.abs(dx)) {
      matches = true;
      score = Math.abs(dy) + Math.abs(dx) * 0.5;
    } else if (dir === "left" && dx < 0 && Math.abs(dx) >= Math.abs(dy)) {
      matches = true;
      score = Math.abs(dx) + Math.abs(dy) * 0.5;
    } else if (dir === "right" && dx > 0 && Math.abs(dx) >= Math.abs(dy)) {
      matches = true;
      score = Math.abs(dx) + Math.abs(dy) * 0.5;
    }

    if (matches && score < bestDist) {
      bestDist = score;
      best = other;
    }
  }

  return best?.id;
}

/**
 * Coordenadas del arbol "ruta de infiltracion": x e y en porcentaje (0-100)
 * del centro de cada nodo dentro de la caja del arbol.
 * Se posicionan con left: x %; top: y %; transform: translate(-50%,-50%).
 * La ruta sube en diagonal de abajo-izquierda (TELECO) a arriba-derecha (?).
 */
export const LAYOUT: Record<string, { x: number; y: number }> = {
  telecomunicaciones: { x: 14, y: 66 },
  ari: { x: 44, y: 86 },
  dam: { x: 44, y: 46 },
  bootcamp: { x: 72, y: 26 },
  siguiente: { x: 86, y: 8 },
};

/** Coordenadas movil (<768px): nodos apilados en zigzag (x en %, y en %). */
export const MOBILE_LAYOUT: Record<string, { x: number; y: number }> = {
  telecomunicaciones: { x: 30, y: 14 },
  ari: { x: 70, y: 34 },
  dam: { x: 30, y: 54 },
  bootcamp: { x: 70, y: 74 },
  siguiente: { x: 50, y: 90 },
};
