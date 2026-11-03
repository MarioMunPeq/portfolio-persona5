export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  /** Rango temporal. */
  period: string;
  /** Resumen de una o dos frases. */
  summary: string;
  /** Responsabilidades concretas. */
  highlights: string[];
  /** Metadato corto opcional (modalidad/contrato/duracion). */
  meta?: string;
  /** Ubicacion / centro de trabajo. */
  location?: string;
  /** Tecnologias y herramientas empleadas. */
  tech?: string[];
  /** Logo/avatar opcional de la empresa (se muestra como avatar de chat). */
  logo?: string;
  /** Texto alternativo del logo. */
  logoAlt?: string;
}

export const experience: ExperienceEntry[] = [
  {
    id: "synersight",
    company: "Synersight, S.L.",
    role: "Tecnico — Practicas Grado Superior ARI",
    period: "Mar 2022 — Jun 2022",
    summary:
      "Participacion activa en reuniones, relacionada con automatizacion y robotica industrial.",
    highlights: [],
    meta: "Practicas",
    tech: ["SEE Electrical", "Robots", "AGV"],
  },
  {
    id: "michelin",
    company: "Michelin",
    role: "Tecnico — Practicas Grado Superior DAM",
    period: "Mar 2024 — Jun 2024",
    summary:
      "Participacion en tareas relacionadas con desarrollo de aplicaciones, analisis de datos y herramientas de Microsoft y entornos industriales.",
    highlights: [],
    meta: "Practicas",
    tech: ["Power Apps", "Power BI", "PI Vision", "Python", "SharePoint"],
  },
  {
    id: "qualentum",
    company: "Qualentum",
    role: "Bootcamp de Inteligencia Artificial",
    period: "Jun 2024 — Ene 2025",
    summary: "Bootcamp de inteligencia artificial.",
    highlights: [],
    meta: "450 horas",
    tech: ["Inteligencia Artificial"],
  },
  {
    id: "diputacion",
    company: "Diputacion de Valladolid",
    role: "Desarrollador web",
    period: "Feb 2026 — Sep 2026",
    summary: "Desarrollo web Liferay, Odoo y soporte tecnico.",
    highlights: [
      "Desarrollo web con Liferay",
      "Desarrollo con Odoo",
      "Soporte tecnico",
    ],
    meta: "Sector publico",
    location: "Valladolid, España",
    tech: ["Liferay", "Odoo", "Desarrollo web", "Soporte tecnico"],
  },
  {
    id: "cognizant",
    company: "Cognizant",
    role: "Pega Developer — Graduate Program",
    period: "Sep 2026 — Actualidad",
    summary:
      "Programa de graduate developer especializado en desarrollo de soluciones empresariales con Pega.",
    highlights: [],
    meta: "Trabajo",
    location: "España",
    tech: ["Pega", "Java"],
  },
];
