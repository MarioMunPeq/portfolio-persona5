export interface ProfileLink {
  label: string;
  url: string;
}

export interface SpokenLanguage {
  name: string;
  level: string;
  /** Nota opcional (certificados oficiales). */
  note?: string;
}

export interface ProfileSkills {
  /** Lenguajes de programacion. */
  programming: string[];
  /** Tecnologias y herramientas. */
  technologies: string[];
  /** Inteligencia artificial y datos. */
  aiData: string[];
  /** Otras herramientas. */
  other: string[];
}

export interface Profile {
  name: string;
  alias: string;
  role: string;
  roleFull: string;
  location: string;
  /** Frase corta del hero. */
  tagline: string;
  /** Textos tipograficos del hero. */
  hero: {
    /** Primer bloque del nombre (solido). */
    nameFirst: string;
    /** Segundo bloque del nombre (contorno). */
    nameLast: string;
    /** Eyebrow rojo con prefijo ◄ bajo el titulo. */
    eyebrow: string;
    /** Region corta mostrada en la franja superior. */
    region: string;
    /** Palabra gigante de fondo del hero (agua de marca). */
    ghost: string;
    /** Linea principal del bloque derecho. */
    roleLine: string;
    /** Linea secundaria del bloque derecho. */
    credentialLine: string;
    /** Coordenadas decorativas del bloque derecho. */
    coordinates: string;
  };
  /** Textos de marca reutilizados en overlays (LoadScreen, hero). */
  branding: {
    /** Etiqueta tipo "Sistema personal". */
    system: string;
    /** "CV viviente". */
    cvViviente: string;
    /** "Cargando". */
    loading: string;
    /** Version mostrada en la franja superior del menu. */
    version: string;
  };
  /** Enlaces de contacto. url null = sin enlace disponible. */
  links: {
    github: ProfileLink | null;
    linkedin: ProfileLink | null;
  };
  about: {
    /** Parrafos de la seccion "Sobre mi". */
    paragraphs: string[];
    /** Bio corta de la pantalla de personaje (Perfil). */
    bio: string;
    /** areas de interes. */
    interests: string[];
    /** Habilidades tecnicas por categorias. */
    skills: ProfileSkills;
    /** Idiomas hablados. */
    languages: SpokenLanguage[];
    /** Otros datos (permiso de conducir…). */
    license: string;
    /** Foto/avatar. null = usar placeholder visual. */
    avatar: { src: string; alt: string } | null;
  };
}

export const profile: Profile = {
  name: "Mario Muñoz Pequeño",
  alias: "Mario Muñoz Pequeño",
  role: "SOFTWARE DEVELOPER",
  roleFull: "Desarrollador de aplicaciones",
  location: "Valladolid, España",
  tagline:
    "Desarrollador de aplicaciones con interes en inteligencia artificial, automatizacion y desarrollo.",
  hero: {
    nameFirst: "Mario",
    nameLast: "Muñoz Pequeño",
    eyebrow: "Desarrollador de aplicaciones",
    region: "Valladolid · Es",
    ghost: "Menu",
    roleLine: "Software Developer",
    credentialLine: "F.P. Grado Superior — DAM",
    coordinates: "41.6523° N, 4.7245° O",
  },
  branding: {
    system: "Menu principal",
    cvViviente: "CV Viviente",
    loading: "Cargando",
    version: "v.2026",
  },
  links: {
    github: { label: "GitHub", url: "https://github.com/MarioMunPeq" },
    linkedin: {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/mario-mu%C3%B1oz-peque%C3%B1o/",
    },
  },
  about: {
    paragraphs: [
      "Desarrollador de aplicaciones con interes en inteligencia artificial, automatizacion y desarrollo. Disfruto creando soluciones que resuelvan problemas reales y aprendiendo nuevas tecnologias mediante proyectos practicos.",
    ],
    bio: "Desarrollador de aplicaciones con interes en inteligencia artificial, automatizacion y desarrollo. Disfruto creando soluciones que resuelvan problemas reales y aprendiendo nuevas tecnologias mediante proyectos practicos.",
    interests: [
      "Inteligencia Artificial",
      "Backend",
      "Automatizacion",
      "Videojuegos",
    ],
    skills: {
      programming: ["Java", "Python", "Kotlin", "C#", "SQL", "HTML/CSS"],
      technologies: [
        "Git/GitHub",
        "Liferay",
        "Odoo",
        "Power Platform",
        "Android Studio",
        "Unity/Godot",
      ],
      aiData: ["Scikit-learn", "Pandas", "PyTorch"],
      other: ["Office", "Figma", "Firebase"],
    },
    languages: [
      { name: "Castellano", level: "Nativo" },
      { name: "Ingles", level: "B2", note: "Certificado (Oxford, Trinity)" },
    ],
    license: "Permiso de conducir B",
    avatar: {
      src: "/images/retrato.webp",
      alt: "Retrato de Mario Muñoz Pequeño",
    },
  },
};
