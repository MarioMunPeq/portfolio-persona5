import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

import { Screen } from "../components/transition/Screen";
import { SectionTitle } from "../components/ui/SectionTitle";
import { PageBackground } from "../components/layout/PageBackground";
import { useTransitionDone } from "../components/transition/useTransitionDone";
import {
  EDU_TREE,
  type EduNode,
  completedCount,
  totalCount,
  findNode,
  nearestNeighbor,
} from "../data/skill-tree";
import {
  faGraduationCap,
  faTowerBroadcast,
  faRobot,
  faCode,
  faMicrochip,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

/* ══════════════════════════════════════════════════════════════════════
   Iconos FontAwesome (misma clave que skill-tree.ts: EduNode.icon)
   ══════════════════════════════════════════════════════════════════════ */
const ICON_PATHS: Record<string, string> = {
  cap: (faGraduationCap.icon[4] as string) ?? "",
  antenna: (faTowerBroadcast.icon[4] as string) ?? "",
  robot: (faRobot.icon[4] as string) ?? "",
  code: (faCode.icon[4] as string) ?? "",
  chip: (faMicrochip.icon[4] as string) ?? "",
  question: (faCircleQuestion.icon[4] as string) ?? "",
};
const ICON_VIEWS: Record<string, string> = {
  cap: `0 0 ${faGraduationCap.icon[0]} ${faGraduationCap.icon[1]}`,
  antenna: `0 0 ${faTowerBroadcast.icon[0]} ${faTowerBroadcast.icon[1]}`,
  robot: `0 0 ${faRobot.icon[0]} ${faRobot.icon[1]}`,
  code: `0 0 ${faCode.icon[0]} ${faCode.icon[1]}`,
  chip: `0 0 ${faMicrochip.icon[0]} ${faMicrochip.icon[1]}`,
  question: `0 0 ${faCircleQuestion.icon[0]} ${faCircleQuestion.icon[1]}`,
};

/* ══════════════════════════════════════════════════════════════════════
   Layout desktop (píxeles lógicos del escenario, espec §2.b)
   ══════════════════════════════════════════════════════════════════════ */
export const LAYOUT_DESKTOP: Record<string, { x: number; y: number }> = {
  telecomunicaciones: { x: 210, y: 390 },
  dam: { x: 500, y: 190 },
  ari: { x: 500, y: 560 },
  bootcamp: { x: 800, y: 330 },
  siguiente: { x: 905, y: 120 },
};
export const LAYOUT_MOBILE: Record<string, { x: number; y: number }> = {
  telecomunicaciones: { x: 140, y: 110 },
  dam: { x: 280, y: 250 },
  ari: { x: 140, y: 390 },
  bootcamp: { x: 280, y: 530 },
  siguiente: { x: 140, y: 670 },
};

export const BOARD_W = 1760;
export const BOARD_H = 720;
export const SCENARIO_W = 1060;
export const SCENARIO_H = 720;
export const PANEL_W = 660;
export const PANEL_H = 720;
export const PLATE_W_DESKTOP = 300;
export const PLATE_H_DESKTOP = 116;
export const PLATE_W_LOCKED = 210;
export const PLATE_H_LOCKED = 92;

export const ROT_BY_NODE: Record<string, number> = {
  telecomunicaciones: -3,
  dam: 2,
  ari: -2,
  bootcamp: 3,
  siguiente: -2,
};

export const NAME_SIZE: Record<string, number> = {
  telecomunicaciones: 42,
  dam: 48,
  ari: 38,
  bootcamp: 30,
};

export const YEAR_ANCHOR: Record<string, { x: number; y: number }> = {
  telecomunicaciones: { x: 20, y: -14 },
  dam: { x: 280, y: -14 },
  ari: { x: 280, y: -14 },
  bootcamp: { x: 280, y: 132 },
};

export const NODE_YEAR: Record<string, number | undefined> = {
  telecomunicaciones: 2020,
  dam: 2024,
  ari: 2022,
  bootcamp: 2025,
  siguiente: undefined,
};

export const SCENARIO_P =
  "24,64 1036,18 1010,168 1048,330 1022,520 1044,696 44,708 74,540 16,364 48,214";
export const PLATE_POINTS = "4,16 30,2 296,6 296,98 266,114 6,110";

const EDGES: { from: string; to: string; locked?: boolean }[] = [
  { from: "telecomunicaciones", to: "dam" },
  { from: "telecomunicaciones", to: "ari" },
  { from: "dam", to: "bootcamp" },
  { from: "bootcamp", to: "siguiente", locked: true },
];

const ROT_PATTERN = [-4, 3, -2, 4];
const TY_PATTERN = [3, -3, 3, -3];

/* ══════════════════════════════════════════════════════════════════════
   Estilos de la página (todo el CSS vive aquí; no hay CSS muerto)
   ══════════════════════════════════════════════════════════════════════ */
const STYLES = `
/* Reset necesario del main de Layout para education (sin scroll desktop) */
#main.education-main {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 0 !important;
  height: auto !important;
  overflow: visible !important;
}

.edu-page {
  position: relative;
  z-index: 1;
  width: 100%;
  display: block;
  overflow: visible;
}

.edu-col {
  position: relative;
  margin: 0 auto;
  /* width se ajusta en JS: 1760 * var(--edu-s) */
  width: 1760px;
  --edu-s: 1;
}

/* Cabecera: mismo contenedor que Projects, contenido por debajo de la topbar */
.edu-header {
  position: relative;
  z-index: 2;
  /* padding-top empuja el contenido por debajo de la topbar fija;
     ResizeObserver mide --topbar-h para que el título quede 100% visible */
  padding-top: calc(var(--topbar-h, 120px) + 12px);
}

/* Título HABILIDADES: p5hatty, clamp(44px, 4.4vw, 84px), 100% visible bajo la topbar */
.edu-header .section-title__h1 {
  font-family: var(--font-hatty) !important;
  font-size: clamp(44px, 4.4vw, 84px) !important;
  line-height: 0.95 !important;
  letter-spacing: -0.02em !important;
  margin: 0 !important;
  padding: 0 !important;
  text-transform: uppercase !important;
}

/* Etiqueta RUTA DE FORMACIÓN */
.edu-header header > p {
  margin: 0 !important;
  padding: 0 !important;
}

/* Ocultar subrayado rojo y rombo dorado del SectionTitle (no rectángulos decorativos) */
.edu-header span[class*="bg-accent"],
.edu-header span[class*="bg-gold"],
.edu-header .section-title__deco {
  display: none !important;
}

/* Fila ◆◆◆◆◇ + 04 / 05 alineada al borde izquierdo del título */
.edu-progress {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  flex-shrink: 0;
}
.edu-progress-diamonds {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 4px;
  color: #fff;
}
.edu-progress-count {
  font-family: "Anton", "Arial Narrow", sans-serif;
  font-size: 22px;
  color: #e8112d;
}

/* ═══ Tablero: escala y posición absoluta en píxeles lógicos ═══ */
.edu-sizer {
  width: calc(1760px * var(--edu-s));
  height: calc(720px * var(--edu-s));
  position: relative;
}

.edu-board {
  width: 1760px;
  height: 720px;
  position: relative;
  transform: scale(var(--edu-s));
  transform-origin: top left;
  transform-box: border-box;
}

/* Wrapper extra para el shake del tablero (GSAP anima su translate) */
.edu-shake-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Escenario y panel: absoluto dentro del tablero, mismos top/bottom */
.edu-scenario,
.edu-panel-wrap {
  position: absolute;
  top: 0;
  display: block;
}
.edu-scenario {
  left: 0;
  width: 1060px;
  height: 720px;
}
.edu-panel-wrap {
  left: 1100px;
  width: 660px;
  height: 720px;
}

/* Nodos HTML sobre el escenario */
.edu-node-wrap {
  position: absolute;
  overflow: visible;
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
}
.edu-node-wrap:not(.selected) {
  opacity: 0.8;
}
.edu-node-wrap:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

/* drop anima SOLO y (caída); pop anima SOLO scale y rotation (aterrizaje) */
.edu-drop {
  position: relative;
}
.edu-pop {
  transform-origin: center;
}

/* Sombra y placa del nodo (dentro del svg de fondo propio) */
.edu-shadow {
  fill: #e8112d;
  stroke: #0d0d0d;
  stroke-width: 4;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
  transform-origin: center;
  transform-box: fill-box;
}
.edu-plate {
  fill: #111;
  stroke: #fff;
  stroke-width: 5;
  stroke-linejoin: miter;
  vector-effect: non-scaling-stroke;
  transform-origin: center;
  transform-box: fill-box;
}
.edu-node-wrap.selected .edu-plate {
  fill: #fff;
}
.edu-node-wrap.locked .edu-plate {
  fill: rgba(17, 17, 17, 0.75);
  stroke-dasharray: 10 7;
}

/* Nombre */
.edu-nombre {
  font-family: var(--font-hatty);
  line-height: 1;
  white-space: nowrap;
}
.edu-nombre span {
  display: inline-block;
}
.edu-node-wrap.selected .edu-nombre {
  color: #111;
  -webkit-text-stroke: none;
  paint-order: normal;
}
.edu-node-wrap:not(.selected) .edu-nombre {
  color: #fff;
  -webkit-text-stroke: 3px #111;
  paint-order: stroke fill;
}

/* Tipo */
.edu-tipo {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.22em;
  margin-top: 6px;
  text-transform: uppercase;
}
.edu-node-wrap:not(.selected) .edu-tipo {
  color: #ff4d5e;
}
.edu-node-wrap.selected .edu-tipo {
  color: #e8112d;
}

/* Icono */
.edu-icon-circle {
  width: 58px;
  height: 58px;
  border: 4px solid #fff;
  border-radius: 50%;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.edu-icon-circle svg {
  width: 28px;
  height: 28px;
  fill: #fff;
}

/* Triángulo ◀ seleccionado (CSS) */
.edu-tri {
  position: absolute;
  left: 300px;
  top: 58px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 11px 0 11px 22px;
  border-color: transparent transparent transparent #e8112d;
  pointer-events: none;
}

/* Año pegatina */
.edu-year {
  font-family: var(--font-hatty);
  font-size: 64px;
  color: #111;
  -webkit-text-stroke: 12px #fff;
  paint-order: stroke fill;
  text-shadow: 5px 5px 0 #e8112d;
  white-space: nowrap;
  position: absolute;
  transform-origin: center;
  transform-box: fill-box;
}

/* Etiquetas guía INICIO / PRÓXIMO */
.edu-guide {
  position: absolute;
  transform-origin: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-display);
}
.edu-guide.inicio {
  width: 120px;
  height: 34px;
  left: 80px;
  top: 475px;
  transform: rotate(-5deg);
}
.edu-guide.proximo {
  width: 140px;
  height: 36px;
  left: 905px;
  top: 194px;
  transform: rotate(3deg);
}
.edu-guide-plate {
  width: 100%;
  height: 100%;
  background: #e8112d;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 800;
}

/* ═══ Panel ═══ */
.edu-panel-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.edu-panel-bg polygon {
  vector-effect: non-scaling-stroke;
  stroke-linejoin: miter;
}
.edu-panel-shadow {
  fill: #e8112d;
  stroke: #0d0d0d;
  stroke-width: 4;
  transform: translate(14px, 14px);
  transform-origin: center;
}
.edu-panel-plate {
  fill: #111;
  stroke: #fff;
  stroke-width: 5;
}
.edu-panel-wrap {
  /* Panel alineado con el escenario (misma top/bottom); rotación omitida para
     cumplir la verificación de que nada excede el rect del tablero. */
  transform-origin: center;
}

.edu-panel-content {
  position: absolute;
  inset: 0;
  padding: 52px 84px 48px 76px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  height: 100%;
}
.edu-panel-content > * {
  margin-left: 0;
}

/* Mini placa roja del tipo */
.edu-panel-kicker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 48px;
  background: #e8112d;
  color: #fff;
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 800;
  clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
  transform: rotate(-2deg);
  transform-origin: center;
  flex-shrink: 0;
}

/* Título */
.edu-panel-title {
  font-family: var(--font-hatty);
  font-size: 46px;
  line-height: 1.1;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  max-height: calc(46px * 1.1 * 3.2);
  overflow: hidden;
}

/* HORAS */
.edu-panel-hours {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}
.edu-hour-number {
  font-family: var(--font-hatty);
  font-size: 140px;
  line-height: 0.9;
  color: #111;
  -webkit-text-stroke: 10px #fff;
  paint-order: stroke fill;
  text-shadow: 6px 6px 0 #e8112d;
  letter-spacing: 0.05em;
}
.edu-hour-label {
  font-family: var(--font-display);
  font-size: 28px;
  color: #e8112d;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1;
}

/* Línea diagonal roja */
.edu-panel-line {
  width: 200px;
  height: 5px;
  background: #e8112d;
  transform: rotate(-3deg);
  transform-origin: left center;
  flex-shrink: 0;
  margin-left: 0;
}

/* PERIODO / CENTRO */
.edu-panel-meta {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex-shrink: 0;
}
.edu-panel-meta .edu-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edu-panel-meta dt {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.3em;
  color: #e8112d;
  text-transform: uppercase;
  font-weight: 800;
  margin: 0;
}
.edu-panel-meta dd {
  font-family: var(--font-display);
  font-size: 34px;
  color: #fff;
  margin: 0;
  line-height: 1;
}

/* Sello */
.edu-panel-seal {
  display: inline-block;
  padding: 8px 22px;
  border: 3px solid #e8112d;
  outline: 3px solid #e8112d;
  outline-offset: 4px;
  color: #e8112d;
  font-family: var(--font-display);
  font-size: 30px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 800;
  transform: rotate(-8deg);
  transform-origin: center;
  align-self: flex-start;
  flex-shrink: 0;
  margin-left: 0;
}
.edu-panel-seal.locked {
  border-color: #888;
  outline-color: #888;
  color: #888;
}

/* ═══ Pegatina "SKILL TREE UNLOCKED" ═══ */
.edu-sticker {
  position: fixed;
  left: 0;
  right: 0;
  width: 100%;
  height: clamp(150px, 20vh, 260px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  pointer-events: none;
  top: 50%;
  transform: translateY(-50%);
}
.edu-sticker-band {
  position: relative;
  width: 100%;
  height: 100%;
}
.edu-sticker-poly {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  clip-path: polygon(0 24%, 100% 0, 100% 76%, 0 100%);
}
.edu-sticker-poly--red {
  background: #e8112d;
  z-index: -1;
  transform: translateY(-10px);
}
.edu-sticker-poly--black {
  background: #0d0d0d;
  z-index: 0;
}
.edu-sticker-poly--white {
  background: #fff;
  z-index: -1;
  transform: translateY(6px);
}
.edu-sticker-text {
  font-family: var(--font-hatty);
  font-size: clamp(64px, 9vw, 170px);
  color: #fff;
  -webkit-text-stroke: 6px #0d0d0d;
  paint-order: stroke fill;
  text-shadow: 8px 8px 0 #e8112d;
  transform: rotate(-4deg);
  transform-origin: center;
  position: relative;
  z-index: 2;
  white-space: nowrap;
  text-align: center;
}

/* Ruta: elementos svg en el escenario */
.edu-route {
  fill: none;
  stroke-linecap: butt;
  vector-effect: non-scaling-stroke;
}
.edu-route-diamond {
  fill: #fff;
  stroke: #111;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
  transform-origin: center;
  transform-box: fill-box;
}

/* Móvil */
@media (max-width: 1023px), (max-height: 559px) {
  .edu-page {
    padding-bottom: calc(var(--bottombar-h, 0) + 24px);
  }
  .edu-col { width: auto; margin: 0; }
  .edu-sizer { width: auto; height: auto; position: static; }
  .edu-board { position: static; width: auto; height: auto; transform: none; }
  .edu-scenario { position: static; width: 100%; height: auto; aspect-ratio: 420 / 760; }
  .edu-panel-wrap { position: static; width: 100%; height: auto; margin-top: 24px; transform: none; }
  .edu-node-wrap { position: static; margin: 0 auto; }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  let el = document.getElementById("edu-styles");
  if (!el) {
    el = document.createElement("style");
    el.id = "edu-styles";
    document.head.appendChild(el);
  }
  el.textContent = STYLES;
}

/* ══════════════════════════════════════════════════════════════════════
   Nodo HTML (PlateNode)
   ══════════════════════════════════════════════════════════════════════ */
interface PlateNodeProps {
  node: EduNode;
  pos: { x: number; y: number };
  selected: boolean;
  onSelect: (id: string) => void;
  registerRefs: (id: string, field: "drop" | "pop", el: HTMLElement | null) => void;
}

function PlateNode({
  node,
  pos,
  selected,
  onSelect,
  registerRefs,
}: PlateNodeProps) {
  const rot = ROT_BY_NODE[node.id];
  const locked = node.status === "locked";
  const plateW = locked ? PLATE_W_LOCKED : PLATE_W_DESKTOP;
  const plateH = locked ? PLATE_H_LOCKED : PLATE_H_DESKTOP;
  const left = pos.x - plateW / 2;
  const top = pos.y - plateH / 2;
  const nameText = locked ? "?" : (node.shortTitle ?? node.title);
  const nameSize = NAME_SIZE[node.id] ?? 30;
  const typeText = locked ? "?" : node.type.toUpperCase();
  const year = NODE_YEAR[node.id];
  const anchor = YEAR_ANCHOR[node.id];
  const iconPath = ICON_PATHS[node.icon];
  const iconView = ICON_VIEWS[node.icon];

  const dropRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerRefs(node.id, "drop", dropRef.current);
    registerRefs(node.id, "pop", popRef.current);
  }, [node.id, registerRefs]);

  // Autoajuste del nombre tras carga de fuentes
  useEffect(() => {
    if (!nombreRef.current) return;
    const el = nombreRef.current;
    const adjust = () => {
      if (!el) return;
      let size = nameSize;
      el.style.fontSize = `${size}px`;
      while (size > 24 && el.scrollWidth > el.clientWidth + 2) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    document.fonts.ready.then(adjust);
    const ro = new ResizeObserver(adjust);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nameSize]);

  const handleSelect = () => onSelect(node.id);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelect();
    } else if (e.key === "Escape") {
      e.preventDefault();
      (window as any)._eduNavigate?.("/");
    } else if (/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key)) {
      e.preventDefault();
      const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      };
      const next = nearestNeighbor(node.id, dirMap[e.key]);
      if (next) onSelect(next);
    }
  };

  const yearEl = year && anchor ? (
    <div
      className="edu-year"
      style={{
        left: anchor.x,
        top: anchor.y,
        transform: "translate(-50%,-50%) rotate(6deg)",
      }}
    >
      {year}
    </div>
  ) : null;

  const ariaLabel = locked
    ? `Bloqueado: ${node.title}. Próxima etapa.`
    : `${node.title}. ${node.type}. ${node.period} en ${node.center}.`;

  return (
    <div
      className={`edu-node-wrap ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
      role="button"
      tabIndex={0}
      data-id={node.id}
      aria-label={ariaLabel}
      aria-pressed={selected}
      style={{
        position: "absolute",
        left,
        top,
        width: plateW,
        height: plateH,
        overflow: "visible",
        transform: `rotate(${rot}deg)`,
        transformOrigin: "center",
      }}
      onClick={handleSelect}
      onFocus={handleSelect}
      onKeyDown={handleKey}
      onMouseEnter={!locked ? handleSelect : undefined}
    >
      <div className="edu-drop" ref={dropRef}>
        <div className="edu-pop" ref={popRef}>
          <svg
            viewBox={`0 0 ${plateW} ${plateH}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            overflow="visible"
            style={{ display: "block" }}
          >
            {locked ? (
              <defs>
                <pattern
                  id={`edu-stripes-${node.id}`}
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="10" height="10" fill="none" />
                  <line x1="5" y1="0" x2="5" y2="10" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                </pattern>
              </defs>
            ) : null}
            <polygon
              className="edu-shadow"
              points={PLATE_POINTS}
              transform="translate(12 12)"
              fill="#e8112d"
              stroke="#0d0d0d"
              strokeWidth="4"
            />
            <polygon
              className="edu-plate"
              points={PLATE_POINTS}
              fill={locked ? "rgba(17,17,17,0.75)" : "#111"}
              stroke="#fff"
              strokeWidth="5"
              strokeLinejoin="miter"
              style={locked ? { strokeDasharray: "10 7" } : undefined}
            />
            {locked && (
              <rect
                className="edu-locked-sticker"
                x="0"
                y="0"
                width={plateW}
                height={plateH}
                fill="url(#edu-stripes-${node.id})"
              />
            )}
          </svg>
          <div
            className="edu-content"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 20px 0 20px",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            <div className="edu-icon-circle">
              {!locked && (
                <svg
                  x="15"
                  y="15"
                  width="28"
                  height="28"
                  viewBox={iconView}
                  dangerouslySetInnerHTML={{
                    __html: `<path d="${iconPath}" fill="#fff" />`,
                  }}
                />
              )}
            </div>
            <div className="edu-text" style={{ minWidth: 0 }}>
              <div className="edu-nombre" ref={nombreRef} style={{ fontSize: nameSize }}>
                {nameText.split("").map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      transform: `rotate(${ROT_PATTERN[i % 4]}deg) translateY(${TY_PATTERN[i % 4]}px)`,
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <div className="edu-tipo">{typeText}</div>
            </div>
          </div>
          {selected && !locked && (
            <div className="edu-tri" />
          )}
        </div>
        {yearEl}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Escenario (SVG 1:1) + etiquetas guía + rutas
   ══════════════════════════════════════════════════════════════════════ */
interface ScenarioProps {
  registerRouteRefs: (key: string, field: "white" | "red", el: SVGPathElement | null) => void;
}

function Scenario({ registerRouteRefs }: ScenarioProps) {
  const chevronXs: number[] = [];
  for (let x = 70; x <= 1000; x += 45) chevronXs.push(x);

  return (
    <svg
      className="edu-scenario"
      viewBox="0 0 1060 720"
      width="1060"
      height="720"
      overflow="visible"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id="edu-cp">
          <polygon points={SCENARIO_P} />
        </clipPath>
        <pattern
          id="edu-halftone"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect width="10" height="10" fill="#111" />
          <circle cx="5" cy="5" r="2" fill="#fff" opacity={0.07} />
        </pattern>
        <linearGradient id="edu-halftone-mask" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopOpacity={1} />
          <stop offset="1" stopOpacity={0} />
        </linearGradient>
        <mask id="edu-halftone-mask-el">
          <rect width="1060" height="720" fill="url(#edu-halftone-mask)" />
        </mask>
      </defs>

      <polygon points={SCENARIO_P} fill="#0d0d0d" />
      <polygon
        points={SCENARIO_P}
        fill="none"
        stroke="#fff"
        strokeWidth={4}
        transform="translate(-12 -10)"
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={SCENARIO_P}
        fill="none"
        stroke="#e8112d"
        strokeWidth={3}
        transform="translate(10 10)"
        vectorEffect="non-scaling-stroke"
      />

      <g clipPath="url(#edu-cp)">
        <polygon
          className="edu-tajo-a"
          points="-100,720 170,0 250,0 -20,720"
          fill="#a80f22"
          opacity={0.85}
        />
        <polygon
          className="edu-tajo-b"
          points="800,720 960,0 1010,0 850,720"
          fill="#a80f22"
          opacity={0.6}
        />
        <polygon points="380,720 600,0 626,0 406,720" fill="#fff" opacity={0.08} />
        <rect
          width="1060"
          height="720"
          fill="url(#edu-halftone)"
          opacity={0.07}
          mask="url(#edu-halftone-mask-el)"
        />
        <text
          x={530}
          y={400}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-hatty)"
          fontSize={230}
          fill="none"
          stroke="#fff"
          strokeWidth={3}
          style={{ opacity: 0.08 }}
          transform="rotate(-6 530 400)"
          pointerEvents="none"
        >
          FORMACIÓN
        </text>
        {chevronXs.map((x) => (
          <text
            key={x}
            x={x}
            y={692}
            fontFamily="var(--font-display)"
            fontSize={34}
            fill="#fff"
            opacity={0.16}
            pointerEvents="none"
          >
            »
          </text>
        ))}
      </g>

      {/* Rutas (después del fondo, no recortadas) */}
      {EDGES.map((edge) => {
        const from = LAYOUT_DESKTOP[edge.from];
        const to = LAYOUT_DESKTOP[edge.to];
        if (!from || !to) return null;
        const key = `${edge.from}-${edge.to}`;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
        if (edge.locked) {
          return (
            <g key={key} data-edge from={edge.from} to={edge.to} aria-hidden="true">
              <path
                ref={(el) => registerRouteRefs(key, "white", el)}
                data-route
                d={d}
                fill="none"
                stroke="#777"
                strokeWidth={5}
                strokeLinecap="butt"
                strokeDasharray="14 12"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <path
                className="edu-route-diamond"
                d="M -13,-13 L 13,-13 L 13,13 L -13,13 Z"
                transform={`translate(${midX} ${midY}) rotate(45)`}
                fill="#fff"
                stroke="#111"
                strokeWidth={3}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            </g>
          );
        }
        return (
          <g key={key} data-edge from={edge.from} to={edge.to} aria-hidden="true">
            <path
              ref={(el) => registerRouteRefs(key, "white", el)}
              data-route
              d={d}
              fill="none"
              stroke="#fff"
              strokeWidth={18}
              strokeLinecap="butt"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            <path
              ref={(el) => registerRouteRefs(key, "red", el)}
              data-route
              d={d}
              fill="none"
              stroke="#e8112d"
              strokeWidth={8}
              strokeLinecap="butt"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
            <path
              className="edu-route-diamond"
              d="M -13,-13 L 13,-13 L 13,13 L -13,13 Z"
              transform={`translate(${midX} ${midY}) rotate(45)`}
              fill="#fff"
              stroke="#111"
              strokeWidth={3}
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* Etiquetas guía HTML */
function GuideLabels() {
  return (
    <>
      <div className="edu-guide inicio">
        <div className="edu-guide-plate">INICIO</div>
      </div>
      <div className="edu-guide proximo">
        <div className="edu-guide-plate">PRÓXIMO ▶</div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Panel de detalle (HTML dentro del tablero)
   ══════════════════════════════════════════════════════════════════════ */
interface EduDetailPanelProps {
  node: EduNode;
  writing: boolean;
}

function EduDetailPanel({ node, writing }: EduDetailPanelProps) {
  const locked = node.status === "locked";
  const showHours = node.hours != null;
  const horas = showHours ? node.hours : node.year;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [hoursDisplay, setHoursDisplay] = useState(0);

  useEffect(() => {
    const end = horas != null ? horas : 0;
    const dur = 500;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / dur, 1);
      setHoursDisplay(Math.floor(t * end));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [writing, horas]);

  return (
    <div className="edu-panel-wrap">
      <svg className="edu-panel-bg" viewBox="0 0 660 720" width="100%" height="100%" preserveAspectRatio="none" overflow="visible" style={{ display: "block" }}>
        <polygon className="edu-panel-shadow" points="36,0 660,0 624,720 0,720" transform="translate(14 14)" fill="#e8112d" stroke="#0d0d0d" strokeWidth={4} />
        <polygon className="edu-panel-plate" points="36,0 660,0 624,720 0,720" fill="#111" stroke="#fff" strokeWidth={5} />
      </svg>
      <div className="edu-panel-content">
        <div className="edu-panel-kicker">
          {locked ? "?" : node.type.toUpperCase()}
        </div>
        <h1 className="edu-panel-title" ref={titleRef}>
          {node.title}
        </h1>
        {(showHours || node.year) && (
          <div className="edu-panel-hours">
            <span className="edu-hour-number">{hoursDisplay}</span>
            {showHours && <span className="edu-hour-label">HORAS</span>}
          </div>
        )}
        <div className="edu-panel-line" />
        <div className="edu-panel-meta">
          <div className="edu-block">
            <dt>PERIODO</dt>
            <dd>{node.period}</dd>
          </div>
          <div className="edu-block">
            <dt>CENTRO</dt>
            <dd>{node.center}</dd>
          </div>
        </div>
        <span className={`edu-panel-seal ${locked ? "locked" : ""}`}>
          {locked ? "PRÓXIMAMENTE" : "COMPLETADO"}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════════════ */
export function Education() {
  const navigate = useNavigate();
  const transitionDonePromise = useTransitionDone();
  const [transitionDone, setTransitionDone] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedId, setSelectedId] = useState("bootcamp");
  const [writing, setWriting] = useState(false);
  const [animado, setAnimado] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);      // .edu-col
  const eduHeaderRef = useRef<HTMLDivElement>(null); // .edu-header
  const boardRef = useRef<HTMLDivElement>(null);     // .edu-board
  const shakeWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const nodeRefs = useRef<Record<string, { drop: HTMLElement | null; pop: HTMLElement | null }>>({});
  const routeRefs = useRef<Record<string, { white: SVGPathElement | null; red: SVGPathElement | null }>>({});

  EDU_TREE.nodes.forEach((n) => {
    if (!nodeRefs.current[n.id]) nodeRefs.current[n.id] = { drop: null, pop: null };
  });
  EDU_TREE.edges.forEach((e) => {
    const k = `${e.from}-${e.to}`;
    if (!routeRefs.current[k]) routeRefs.current[k] = { white: null, red: null };
  });

  const registerNodeRefs = useCallback(
    (id: string, field: "drop" | "pop", el: HTMLElement | null) => {
      if (nodeRefs.current[id]) nodeRefs.current[id][field] = el;
    },
    []
  );
  const registerRouteRefs = useCallback(
    (key: string, field: "white" | "red", el: SVGPathElement | null) => {
      if (routeRefs.current[key]) routeRefs.current[key][field] = el;
    },
    []
  );

  const active = findNode(selectedId) ?? EDU_TREE.nodes[0]!;

  useEffect(() => {
    injectStyles();
  }, []);

  /* Detectar escritorio (≥1024 y ≥560) */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024 && window.innerHeight >= 560);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Cálculo de --edu-s con ResizeObserver (spec §1) */
  useEffect(() => {
    if (!isDesktop) return;
    let raf = 0;
    const apply = () => {
      const header = eduHeaderRef.current;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const topbar = document.querySelector(".p5-topbar");
      const topbarH = topbar ? topbar.getBoundingClientRect().height : 120;
      document.documentElement.style.setProperty("--topbar-h", `${topbarH}px`);
      const player =
        document.querySelector(".p5-bb-player-wrapper") ??
        document.querySelector(".p5-bottombar");
      const bottombarTop = player ? player.getBoundingClientRect().top : window.innerHeight;
      const availH = bottombarTop - 20 - headerBottom - 12;
      const availW = window.innerWidth - 120;
      const raw = Math.min(availW / BOARD_W, availH / BOARD_H);
      const s = Math.max(0.45, Math.min(raw, 1.25));
      if (colRef.current) {
        colRef.current.style.setProperty("--edu-s", String(s));
        colRef.current.style.width = `${BOARD_W * s}px`;
      }
    };
    const recompute = () => {
      raf = requestAnimationFrame(apply);
    };
    apply();
    recompute();
    const roHeader = new ResizeObserver(recompute);
    if (eduHeaderRef.current) roHeader.observe(eduHeaderRef.current);
    const roDoc = new ResizeObserver(recompute);
    roDoc.observe(document.documentElement);
    window.addEventListener("resize", recompute);
    document.fonts.ready.then(recompute);
    return () => {
      cancelAnimationFrame(raf);
      roHeader.disconnect();
      roDoc.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [isDesktop]);

  (window as any)._eduNavigate = (path: string) => navigate(path);

  useEffect(() => {
    transitionDonePromise.then(() => setTransitionDone(true));
  }, [transitionDonePromise]);

  /* ═══ Animaciones GSAP (spec §5) ═══ */
  useLayoutEffect(() => {
    if (!transitionDone || animado) return;
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scope = containerRef.current;
    if (!scope) return;

    try {
      const ctx = gsap.context(() => {
        const getNode = (id: string) => nodeRefs.current[id];
        const getRoute = (key: string) => routeRefs.current[key];
        const setSafe = (target: any, vars: any) => {
          if (target == null) return;
          gsap.set(target, vars);
        };

        if (prefersReduced) {
          Object.values(nodeRefs.current).forEach(({ drop, pop }) => {
            setSafe(drop, { y: 0 });
            setSafe(pop, { scale: 1, rotation: 0, opacity: 1 });
          });
          Object.values(routeRefs.current).forEach(({ white, red }) => {
            setSafe(white, { strokeDashoffset: 0, strokeDasharray: "none" });
            setSafe(red, { strokeDashoffset: 0, strokeDasharray: "none" });
          });
          document.querySelectorAll<HTMLElement>(".edu-year").forEach((el) => setSafe(el, { scale: 1, opacity: 1, rotation: 6 }));
          document.querySelectorAll<SVGElement>(".edu-route-diamond").forEach((el) => setSafe(el, { scale: 1, opacity: 1 }));
          setAnimado(true);
          return;
        }

        /* Estado inicial */
        Object.values(nodeRefs.current).forEach(({ drop, pop }) => {
          setSafe(drop, { y: -160 });
          setSafe(pop, { scale: 0, opacity: 0 });
        });
        Object.values(routeRefs.current).forEach(({ white, red }) => {
          setSafe(white, { strokeDasharray: "1", strokeDashoffset: 1, strokeLinecap: "butt" });
          setSafe(red, { strokeDasharray: "1", strokeDashoffset: 1, strokeLinecap: "butt" });
        });
        document.querySelectorAll<HTMLElement>(".edu-year").forEach((el) => setSafe(el, { scale: 0, opacity: 0 }));
        document.querySelectorAll<SVGElement>(".edu-route-diamond").forEach((el) => setSafe(el, { scale: 0, opacity: 0 }));

        const tl = gsap.timeline();

        /* ── Pegatina SKILL TREE UNLOCKED ── */
        const sticker = document.createElement("div");
        sticker.className = "edu-sticker";
        sticker.innerHTML = `
          <div class="edu-sticker-band">
            <div class="edu-sticker-poly edu-sticker-poly--red"></div>
            <div class="edu-sticker-poly edu-sticker-poly--black"></div>
            <div class="edu-sticker-poly edu-sticker-poly--white"></div>
            <span class="edu-sticker-text">SKILL TREE UNLOCKED</span>
          </div>
        `;
        document.body.appendChild(sticker);
        const band = sticker.querySelector(".edu-sticker-band") as HTMLElement;
        const stickerText = sticker.querySelector(".edu-sticker-text") as HTMLElement;

        const shakeSticker = () => {
          if (!band) return;
          gsap.killTweensOf(band);
          gsap.fromTo(band, { x: -6 }, { x: 6, duration: 0.06, repeat: 9, yoyo: true, ease: "none" });
        };
        const flashSticker = () => {
          if (!stickerText) return;
          gsap.killTweensOf(stickerText);
          gsap.fromTo(stickerText, { filter: "brightness(1)" }, { filter: "brightness(2)", duration: 0.08, yoyo: true, repeat: 1, ease: "none" });
        };

        tl.fromTo(sticker, { x: "-110%" }, { x: "0%", duration: 0.25, ease: "power4.out" })
          .to({}, { duration: 0.55 })
          .call(() => { shakeSticker(); flashSticker(); })
          .to(sticker, { x: "110%", duration: 0.2, ease: "power3.in" })
          .call(() => sticker.remove());

        /* ── Escenario aparece t=0.9 ── */
        tl.fromTo(
          ".edu-scenario",
          { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)" },
          { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: 0.5, ease: "power3.out" },
          0.9
        )
        .fromTo(".edu-tajo-a", { x: -400 }, { x: 0, duration: 0.5, ease: "power2.out" }, 0.9)
        .fromTo(".edu-tajo-b", { x: 400 }, { x: 0, duration: 0.5, ease: "power2.out" }, 0.9);

        const flashWhite = () => {
          const board = boardRef.current;
          if (!board) return;
          gsap.killTweensOf(board);
          gsap.fromTo(board, { filter: "brightness(1)" }, { filter: "brightness(1.35)", duration: 0.05, yoyo: true, repeat: 1, ease: "none" });
        };

        const shakeBoard = () => {
          if (!shakeWrapRef.current) return;
          gsap.killTweensOf(shakeWrapRef.current);
          gsap.fromTo(shakeWrapRef.current, { x: -7 }, { x: 0, duration: 0.35, ease: "power1.out" });
        };

        const shadowLand = (id: string) => {
          const n = getNode(id);
          if (!n || !n.drop) return;
          const shadow = n.drop.querySelector<SVGElement>(".edu-shadow");
          if (!shadow) return;
          gsap.fromTo(shadow, { transform: "translate(0,0)" }, { transform: "translate(12px,12px)", duration: 0.3, ease: "back.out(2)" });
        };

        const selloAnio = (id: string) => {
          const n = getNode(id);
          if (!n || !n.drop) return;
          const year = n.drop.querySelector<HTMLElement>(".edu-year");
          if (!year) return;
          gsap.fromTo(year, { scale: 2.4, rotation: -14 }, { scale: 1, rotation: 6, duration: 0.3, ease: "back.out(2.2)" });
        };

        const animateLetters = (id: string) => {
          const n = getNode(id);
          if (!n || !n.drop) return;
          const nombre = n.drop.querySelector<HTMLElement>(".edu-nombre");
          if (!nombre) return;
          const letters = Array.from(nombre.querySelectorAll("span"));
          gsap.killTweensOf(letters);
          gsap.fromTo(letters, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out", stagger: 0.025 });
        };

        const drawRoutes = (fromId: string) => {
          const edge = EDGES.find((e) => e.from === fromId);
          if (!edge) return;
          const key = `${edge.from}-${edge.to}`;
          const r = getRoute(key);
          const white = r.white;
          if (!white) return;
          const len = white.getTotalLength();
          const midDiamond = document.querySelector(
            `[data-edge][from="${edge.from}"][to="${edge.to}"] .edu-route-diamond`,
          );
          const spark = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          spark.setAttribute("width", "10");
          spark.setAttribute("height", "10");
          spark.setAttribute("fill", "#fff");
          spark.style.transformBox = "fill-box";
          spark.style.transformOrigin = "center";
          white.parentNode?.appendChild(spark);
          const label = `draw-${key}`;
          const red = r.red;
          tl.to(white, { strokeDashoffset: 0, duration: 0.38, ease: "power2.inOut" }, label);
          if (red) tl.to(red, { strokeDashoffset: 0, duration: 0.38, ease: "power2.inOut" }, `${label} += 0.08`);
          tl.call(() => {
            let t = 0;
            const anim = () => {
              t += 0.02;
              if (t > 1) { spark.remove(); return; }
              const p = white.getPointAtLength(t * len);
              gsap.set(spark, { x: p.x - 5, y: p.y - 5, rotate: 45 });
              requestAnimationFrame(anim);
            };
            requestAnimationFrame(anim);
          }, [], label);
          tl.call(() => {
            if (midDiamond) {
              gsap.fromTo(midDiamond, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)" });
            }
            spark.remove();
          }, [], `${label} += 0.38`);
        };

        const fallWithEffects = (id: string) => {
          const n = getNode(id);
          if (!n || !n.drop || !n.pop) return;
          const rot = ROT_BY_NODE[id];
          tl.to(n.drop, { y: 0, duration: 0.38, ease: "power4.in" })
            .to(n.pop, { scale: 1.3, rotation: rot > 0 ? 7 : -7, duration: 0.12, ease: "power2.out" }, "-=0.15")
            .to(n.pop, { scale: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" })
            .call(() => flashWhite())
            .call(() => shakeBoard())
            .call(() => shadowLand(id))
            .call(() => selloAnio(id))
            .call(() => animateLetters(id))
            .to({}, { duration: 0.2 })
            .call(() => drawRoutes(id));
        };

        /* Secuencia de nodos */
        fallWithEffects("telecomunicaciones");
        tl.to({}, { duration: 0.55 });
        fallWithEffects("dam");
        fallWithEffects("ari");
        tl.to({}, { duration: 0.55 });
        fallWithEffects("bootcamp");
        tl.to({}, { duration: 0.55 });
        fallWithEffects("siguiente");
        tl.call(() => {
          const siguiente = document.querySelector("[data-id='siguiente']") as HTMLElement | null;
          if (siguiente) {
            gsap.to(siguiente, { opacity: 0, duration: 0.05, repeat: 3, yoyo: true, ease: "none" });
          }
        });

        /* Estado final estático */
        tl.call(() => {
          Object.values(nodeRefs.current).forEach(({ drop, pop }) => {
            setSafe(drop, { y: 0 });
            setSafe(pop, { scale: 1, rotation: 0, opacity: 1 });
          });
        });

        /* Final: seleccionar BOOTCAMP IA y entrar panel */
        tl.to({}, { duration: 0.6 }).call(() => {
          setSelectedId("bootcamp");
          setAnimado(true);
          entrarPanel();
        });

        /* Seguridad 5s */
        const timer = setTimeout(() => {
          if (tl.progress() < 1) {
            tl.progress(1);
            document.querySelector(".edu-sticker")?.remove();
            setAnimado(true);
          }
        }, 5000);

        return () => {
          clearTimeout(timer);
          tl.kill();
          ctx.revert();
        };
      }, scope);
    } catch (e) {
      console.error("[education animación] error:", e);
      Object.values(nodeRefs.current).forEach(({ drop, pop }) => {
        if (drop) gsap.set(drop, { y: 0 });
        if (pop) gsap.set(pop, { scale: 1, rotation: 0, opacity: 1 });
      });
      Object.values(routeRefs.current).forEach(({ white, red }) => {
        if (white) gsap.set(white, { strokeDashoffset: 0, strokeDasharray: "none" });
        if (red) gsap.set(red, { strokeDashoffset: 0, strokeDasharray: "none" });
      });
      setAnimado(true);
    }
  }, [transitionDone]);

  const entrarPanel = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.killTweensOf(panel);
    gsap.fromTo(
      panel,
      { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", opacity: 0 },
      { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1, duration: 0.25, ease: "power2.out" }
    );
  }, []);

  const resaltarRuta = useCallback((id: string) => {
    const node = findNode(id);
    if (!node) return;
    const requeridos = new Set<string>();
    let actual: string | undefined = id;
    while (actual) {
      requeridos.add(actual);
      const n = findNode(actual);
      if (!n || n.requires.length === 0) break;
      actual = n.requires[0];
    }
    Object.values(routeRefs.current).forEach((r) => {
      const edgeEl = (r.white?.parentElement ?? r.red?.parentElement) as HTMLElement | null;
      if (!edgeEl) return;
      const to = edgeEl.getAttribute("to") ?? "";
      const activa = requeridos.has(to);
      const targets = [r.white, r.red].filter(Boolean) as SVGPathElement[];
      targets.forEach((t) => {
        gsap.killTweensOf(t);
        gsap.to(t, {
          strokeWidth: activa ? 20 : (to === "siguiente" ? 5 : 8),
          stroke: activa ? "#fff" : (to === "siguiente" ? "#777" : "#e8112d"),
          opacity: activa ? 1 : 0.45,
          duration: 0.25,
        });
      });
    });
    Object.keys(nodeRefs.current).forEach((nid) => {
      const el = document.querySelector(`[data-id='${nid}']`);
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.to(el, { opacity: requeridos.has(nid) || nid === id ? 1 : 0.8, duration: 0.25 });
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      if (writing) return;
      setSelectedId(id);
      const panel = panelRef.current;
      if (panel) {
        gsap.killTweensOf(panel);
        gsap.fromTo(
          panel,
          { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", opacity: 0 },
          { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1, duration: 0.25, ease: "power2.out" }
        );
      }
      setWriting(true);
      setTimeout(() => setWriting(false), 600);
      resaltarRuta(id);
    },
    [writing, resaltarRuta]
  );

  useEffect(() => {
    if (animado && transitionDone) resaltarRuta(selectedId);
  }, [selectedId, resaltarRuta, transitionDone, animado]);

  /* Teclado */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const nodes = EDU_TREE.nodes;
        const curr = nodes.findIndex((n) => n.id === selectedId);
        const next = e.shiftKey ? (curr - 1 + nodes.length) % nodes.length : (curr + 1) % nodes.length;
        handleSelect(nodes[next].id);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(selectedId);
        return;
      }
      if (/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key)) {
        e.preventDefault();
        const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
          ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        };
        const next = nearestNeighbor(selectedId, dirMap[e.key]);
        if (next) handleSelect(next);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, handleSelect, navigate]);

  /* Vida continua: rombos, respiración, glitch, parallax */
  useEffect(() => {
    if (!animado || typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    /* Respiración sombras */
    ["telecomunicaciones", "dam", "ari", "bootcamp"].forEach((id) => {
      const n = nodeRefs.current[id];
      const shadow = n?.drop?.querySelector<SVGElement>(".edu-shadow");
      if (shadow) {
        gsap.to(shadow, {
          transform: "translate(15px,15px)",
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 3,
        });
      }
    });

    /* Rombos blancos en rutas completadas */
    const completados = ["dam", "ari", "bootcamp", "siguiente"];
    const rombos: SVGElement[] = [];
    completados.forEach((to) => {
      const path = Object.values(routeRefs.current).find((r) => {
        const el = r.white?.parentElement ?? r.red?.parentElement;
        return el ? el.getAttribute("to") === to : false;
      })?.white;
      if (!path) return;
      const len = path.getTotalLength();
      const rombo = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rombo.setAttribute("width", "10");
      rombo.setAttribute("height", "10");
      rombo.setAttribute("fill", "#fff");
      rombo.style.transformBox = "fill-box";
      rombo.style.transformOrigin = "center";
      path.parentNode?.appendChild(rombo);
      rombos.push(rombo);
      let t = 0;
      const anim = () => {
        t = (t + 0.015) % 1;
        const p = path.getPointAtLength(t * len);
        gsap.set(rombo, { x: p.x - 5, y: p.y - 5, rotate: 45 });
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    });

    /* Glitch "?" cada 5s */
    const siguiente = document.querySelector("[data-id='siguiente']") as HTMLElement | null;
    let glitchTimer: number | null = null;
    if (siguiente) {
      const doGlitch = () => {
        gsap.killTweensOf(siguiente);
        gsap.to(siguiente, {
          x: "-=3",
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          ease: "none",
          onComplete: () => {
            gsap.to(siguiente, { x: 0, duration: 0.1 });
            glitchTimer = window.setTimeout(doGlitch, 5000);
          },
        });
      };
      glitchTimer = window.setTimeout(doGlitch, 5000);
    }

    /* Parallax solo palabra fantasma, no táctil */
    let parallaxRAF = 0;
    if (!("ontouchstart" in window)) {
      const ghost = document.querySelector(".edu-scenario text") as SVGElement | null;
      if (ghost) {
        const handleMove = (e: MouseEvent) => {
          cancelAnimationFrame(parallaxRAF);
          parallaxRAF = requestAnimationFrame(() => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx;
            const dy = (e.clientY - cy) / cy;
            gsap.to(ghost, { x: -dx * 10, y: -dy * 10, duration: 1, ease: "power2.out" });
          });
        };
        window.addEventListener("mousemove", handleMove);
        return () => {
          window.removeEventListener("mousemove", handleMove);
          cancelAnimationFrame(parallaxRAF);
        };
      }
    }

    return () => {
      rombos.forEach((r) => r.remove());
      gsap.killTweensOf(".edu-shadow");
      if (glitchTimer) window.clearTimeout(glitchTimer);
      cancelAnimationFrame(parallaxRAF);
    };
  }, [animado]);

  const paddingBottom = isDesktop ? 0 : undefined;

  return (
    <Screen className="edu-page">
      <PageBackground variant="education" />
      <section
        className="relative text-paper"
        style={{ paddingBottom: paddingBottom != null ? paddingBottom : `calc(var(--bottombar-h) + 24px)` }}
        ref={containerRef}
      >
        <div className="edu-col" ref={colRef}>
          <header className="edu-header" ref={eduHeaderRef}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "nowrap" }}>
              <div style={{ flexShrink: 0 }}>
                <SectionTitle label="Ruta de formación" title="HABILIDADES" persona compact />
              </div>
              <div className="edu-progress" aria-label="Progreso de formación">
                <span className="edu-progress-diamonds" aria-hidden="true">
                  {"◆".repeat(completedCount())}{"◇".repeat(totalCount() - completedCount())}
                </span>
                <span className="edu-progress-count">
                  {String(completedCount()).padStart(2, "0")} / {String(totalCount()).padStart(2, "0")}
                </span>
              </div>
            </div>
          </header>

          {isDesktop ? (
            <div className="edu-sizer">
              <div className="edu-shake-wrap" ref={shakeWrapRef}>
                <div className="edu-board" ref={boardRef}>
                  <Scenario registerRouteRefs={registerRouteRefs} />
                  <GuideLabels />
                  {EDU_TREE.nodes.map((node) => {
                    const pos = LAYOUT_DESKTOP[node.id];
                    if (!pos) return null;
                    return (
                      <PlateNode
                        key={node.id}
                        node={node}
                        pos={pos}
                        selected={node.id === selectedId}
                        onSelect={handleSelect}
                        registerRefs={registerNodeRefs}
                      />
                    );
                  })}
                  <EduDetailPanel node={active} writing={writing} />
                </div>
              </div>
            </div>
          ) : (
            <div className="edu-mobile">
              <Scenario registerRouteRefs={registerRouteRefs} />
              <GuideLabels />
              {EDU_TREE.nodes.map((node) => {
                const pos = LAYOUT_MOBILE[node.id];
                if (!pos) return null;
                return (
                  <PlateNode
                    key={node.id}
                    node={node}
                    pos={pos}
                    selected={node.id === selectedId}
                    onSelect={handleSelect}
                    registerRefs={registerNodeRefs}
                  />
                );
              })}
              <EduDetailPanel node={active} writing={writing} />
            </div>
          )}
        </div>
      </section>
    </Screen>
  );
}
