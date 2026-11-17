import {
  faBrain,
  faCarSide,
  faChartArea,
  faCode,
  faCogs,
  faDatabase,
  faFile,
  faFire,
  faMobileAndroid,
  faServer,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import {
  faAndroid,
  faFigma,
  faGitAlt,
  faHtml5,
  faJava,
  faPython,
  faUnity,
} from "@fortawesome/free-brands-svg-icons";
import { profile } from "../data/profile";
import { projects } from "../data/projects";

export const skillLines = [
  { id: "java", name: "Java", badge: "J", color: "#F28711", pattern: "solid" },
  { id: "kotlin", name: "Kotlin", badge: "K", color: "#24B09C", pattern: "solid" },
  { id: "python", name: "Python", badge: "PY", color: "#C73990", pattern: "solid" },
  { id: "csharp", name: "C#", badge: "C#", color: "#A8C93A", pattern: "solid" },
  { id: "sql", name: "SQL", badge: "SQL", color: "#0470BC", pattern: "solid" },
  { id: "web", name: "HTML/CSS", badge: "W", color: "#F6BD25", pattern: "solid" },
  { id: "service", name: "Servicio", badge: "S", color: "#D8D8D8", pattern: "solid" },
] as const;

export type SkillLineId = (typeof skillLines)[number]["id"];
export type SkillStation = {
  id: string;
  name: string;
  lines: SkillLineId[];
  projects: { slug: string; name: string; image: string | null; summary: string }[];
  icon: typeof faJava;
  point: { x: number; y: number };
  level?: string;
};

const stationIds: Record<string, string> = { "C#": "csharp" };

const stationSetup: Record<
  string,
  { lines: SkillLineId[]; point: { x: number; y: number }; aliases?: string[] }
> = {
  Java: { lines: ["java"], point: { x: 120, y: 140 } },
  Kotlin: { lines: ["kotlin"], point: { x: 120, y: 620 } },
  Python: { lines: ["python"], point: { x: 120, y: 700 } },
  "C#": { lines: ["csharp"], point: { x: 1300, y: 380 } },
  SQL: { lines: ["sql"], point: { x: 660, y: 500 } },
  "HTML/CSS": { lines: ["web"], point: { x: 1360, y: 260 } },
  "Git/GitHub": {
    lines: ["java", "python", "csharp", "web", "service"],
    point: { x: 800, y: 380 },
    aliases: ["git", "github"],
  },
  Liferay: { lines: ["java"], point: { x: 380, y: 140 } },
  Odoo: {
    lines: ["python", "sql"],
    point: { x: 800, y: 500 },
  },
  "Power Platform": { lines: ["service"], point: { x: 1160, y: 540 } },
  "Android Studio": {
    lines: ["java", "kotlin"],
    point: { x: 620, y: 380 },
  },
  "Unity/Godot": {
    lines: ["csharp"],
    point: { x: 1040, y: 380 },
    aliases: ["unity", "godot"],
  },
  "Scikit-learn": { lines: ["python"], point: { x: 300, y: 700 } },
  Pandas: { lines: ["python"], point: { x: 640, y: 700 } },
  PyTorch: { lines: ["python"], point: { x: 480, y: 700 } },
  Office: { lines: ["service"], point: { x: 1400, y: 540 } },
  Figma: { lines: ["web"], point: { x: 1100, y: 260 } },
  Firebase: { lines: ["kotlin"], point: { x: 380, y: 620 } },
};

const stationIcons: Record<string, typeof faJava> = {
  Java: faJava,
  Python: faPython,
  Kotlin: faMobileAndroid,
  "C#": faCode,
  SQL: faDatabase,
  "HTML/CSS": faHtml5,
  "Git/GitHub": faGitAlt,
  Liferay: faServer,
  Odoo: faCogs,
  "Power Platform": faChartArea,
  "Android Studio": faAndroid,
  "Unity/Godot": faUnity,
  "Scikit-learn": faBrain,
  Pandas: faTable,
  PyTorch: faFire,
  Office: faFile,
  Figma: faFigma,
  Firebase: faCogs,
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

function projectUsesStation(stack: string[] | null, name: string): boolean {
  if (!stack) return false;
  const normalizedStack = stack.map(normalize);
  const aliases = stationSetup[name]?.aliases?.map(normalize) ?? [normalize(name)];
  return normalizedStack.some((technology) =>
    aliases.some((alias) => technology === alias || technology.includes(alias)),
  );
}

export const skillStations: SkillStation[] = Object.values(profile.about.skills)
  .flat()
  .map((name) => {
    const setup = stationSetup[name];
    if (!setup) throw new Error(`Missing Mementos route for ${name}`);
    return {
      id: stationIds[name] ?? normalize(name).replace(/[^a-z0-9+#]+/g, "-"),
      name,
      lines: [...setup.lines],
      point: setup.point,
      icon: stationIcons[name],
      projects: projects
        .filter((project) => projectUsesStation(project.stack, name))
        .map((project) => ({
          slug: project.slug,
          name: project.name,
          image: project.images?.[0]?.src ?? null,
          summary: project.summary,
        })),
    };
  });

skillStations.push({
  id: "driving-license",
  name: profile.about.license,
  lines: ["service"],
  point: { x: 1380, y: 650 },
  icon: faCarSide,
  projects: [],
});

export const stationById = new Map(skillStations.map((station) => [station.id, station]));

export const routePaths: Record<SkillLineId, string> = {
  java: "M120 140 H340 Q365 140 383 158 L558 335 Q584 380 620 380 H800",
  kotlin: "M120 620 H340 Q365 620 383 602 L558 425 Q584 380 620 380",
  python: "M120 700 H300 H480 H640 H700 Q735 700 754 676 L800 620 V380",
  sql: "M800 500 H660",
  csharp: "M800 380 H1040 H1300",
  web: "M800 380 C836 380 844 352 870 326 L932 264 Q936 260 950 260 H1100 H1360",
  service: "M800 380 C838 380 844 410 870 436 L958 524 Q974 540 1000 540 H1160 H1400 Q1400 540 1380 580 L1380 650",
};
