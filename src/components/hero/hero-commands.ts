import { NAV_ITEMS } from "../navigation/nav-items";
import type { HeroIcon } from "./CommandNavItem";

export interface HeroCommand {
  id: string;
  icon: HeroIcon;
  label: string;
  sub: string;
  subHover: string;
  path: string;
}

const byId = (id: string) => {
  const item = NAV_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`HeroCommand: ruta de nav "${id}" no encontrada`);
  return item.path;
};

/**
 * Comandos del menu principal — etiqueta grande de "sistema" (contexto de
 * juego) con el nombre real de la seccion como subtitulo. Inicio no aparece
 * aqui: esta pantalla ES el menu principal. Los destinos salen de NAV_ITEMS.
 */
export const HERO_COMMANDS: HeroCommand[] = [
  {
    id: "sobre-mi",
    icon: "triangle",
    label: "perfil",
    sub: "SOBRE MI",
    subHover: "DAM · DESARROLLO",
    path: byId("sobre-mi"),
  },
  {
    id: "proyectos",
    icon: "square",
    label: "inventario",
    sub: "PROYECTOS",
    subHover: "WEB · SOFTWARE",
    path: byId("proyectos"),
  },
  {
    id: "experiencia",
    icon: "circle",
    label: "progreso",
    sub: "EXPERIENCIA",
    subHover: "COGNIZANT · PEGA",
    path: byId("experiencia"),
  },
  {
    id: "formacion",
    icon: "cross",
    label: "habilidades",
    sub: "FORMACION",
    subHover: "JAVA · PYTHON · C#",
    path: byId("formacion"),
  },
];
