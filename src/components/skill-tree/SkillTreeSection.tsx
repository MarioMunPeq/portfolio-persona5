import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { DiamondMarker } from "../shared/DiamondMarker";
import { NodeIcon } from "./NodeIcon";
import { SKILL_TREE } from "../../data/skill-tree";
import type { SkillNode } from "../../data/skill-tree";

/* ── Angular badge polygon — square with two diagonal cuts (Persona 5 motif) ── */
const NODE_POINTS = "0,0 88,0 100,12 100,100 12,100 0,88";

/** Inset polygon points toward center (50,50) by a given scale factor. */
function insetPoints(points: string, scale: number): string {
  return points
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return `${50 + (x - 50) * scale},${50 + (y - 50) * scale}`;
    })
    .join(" ");
}

/** Node tier based on education level — drives outline count. */
function getNodeTier(node: SkillNode): number {
  if (node.kind === "locked") return 0;
  if (node.level === "Grado medio") return 1;
  if (node.level === "Grado superior") return 2;
  return 3; // Bootcamp
}

/* ── Hooks ── */

function useContainerSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function useMousePosition(ref: React.RefObject<HTMLDivElement | null>) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener("mousemove", handler, { passive: true });
    return () => el.removeEventListener("mousemove", handler);
  }, [ref]);

  return pos;
}

/* ── Node badge ── */

interface NodeBadgeProps {
  node: SkillNode;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

function NodeBadge({ node, index, selected, onSelect }: NodeBadgeProps) {
  const locked = node.kind === "locked";
  const tier = getNodeTier(node);

  /* One-shot flash: plays glitch animation only when node becomes selected */
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (selected) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(t);
    }
    setFlash(false);
  }, [selected]);
  const glow = selected
    ? "drop-shadow(3px 3px 0 rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(230,0,18,0.9))"
    : "drop-shadow(3px 3px 0 rgba(0,0,0,0.85)) drop-shadow(0 0 10px rgba(230,0,18,0.45))";

  /* Tiered outlines — single / double / triple concentric polygons */
  const outlineScales =
    tier === 3 ? [1.0, 0.91, 0.82] : tier === 2 ? [1.0, 0.89] : [1.0];
  const outlineColors =
    tier === 3
      ? ["var(--color-accent)", "var(--color-paper)", "var(--color-accent)"]
      : tier === 2
        ? ["var(--color-accent)", "var(--color-paper)"]
        : ["var(--color-accent-alt)"];
  const outlineWidths =
    tier === 3 ? [2.5, 1.2, 0.8] : tier === 2 ? [2.5, 1.2] : [2.5];

  return (
    <div
      className="absolute z-10"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={selected}
        aria-label={node.title}
        className="group flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span
          className={`relative block h-14 w-14 sm:h-[68px] sm:w-[68px] ${
            locked
              ? "group-hover:[animation:locked-shake_0.35s_ease-in-out]"
              : "group-hover:scale-110"
          } ${flash && !locked ? "node-glitch-flash" : ""}`}
          style={{
            filter: locked ? "drop-shadow(3px 3px 0 rgba(0,0,0,0.85))" : glow,
            transform: selected && !locked ? "scale(1.08)" : undefined,
            transition: locked ? "none" : "transform 0.1s steps(2)",
          }}
        >
          {/* Halo (unlocked only) */}
          {!locked && <span aria-hidden="true" className="node-halo" />}

          {/* Angular badge SVG */}
          <svg
            viewBox="0 0 100 100"
            className="relative h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <radialGradient
                id={`skill-ng-${node.id}`}
                cx="42%"
                cy="38%"
                r="75%"
              >
                <stop offset="0%" stopColor="#ff3b30" />
                <stop offset="70%" stopColor="#e60012" />
                <stop offset="100%" stopColor="#a3000c" />
              </radialGradient>
              <linearGradient
                id={`skill-ns-${node.id}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              {/* Noise filter for locked nodes */}
              <filter id={`skill-noise-${node.id}`}>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.9"
                  numOctaves="4"
                  seed={index * 7}
                />
                <feColorMatrix type="saturate" values="0" />
                <feBlend in="SourceGraphic" mode="multiply" />
              </filter>
            </defs>

            {/* Tiered outlines (outermost → innermost) */}
            {!locked &&
              outlineScales.map((scale, i) => (
                <polygon
                  key={i}
                  points={insetPoints(NODE_POINTS, scale)}
                  fill="none"
                  stroke={outlineColors[i]}
                  strokeWidth={outlineWidths[i]}
                  strokeLinejoin="round"
                />
              ))}

            {/* Main fill */}
            <polygon
              points={NODE_POINTS}
              fill={
                locked ? "rgba(20,20,20,0.95)" : `url(#skill-ng-${node.id})`
              }
              stroke={locked ? "rgba(245,245,240,0.2)" : "none"}
              strokeWidth={locked ? 1.5 : 0}
              strokeLinejoin="round"
              strokeDasharray={locked ? "4 4" : "none"}
            />

            {/* Shine overlay (unlocked) */}
            {!locked && (
              <polygon
                points={NODE_POINTS}
                fill={`url(#skill-ns-${node.id})`}
              />
            )}

            {/* Static noise overlay (locked) */}
            {locked && (
              <polygon
                points={NODE_POINTS}
                fill="rgba(245,245,240,0.06)"
                filter={`url(#skill-noise-${node.id})`}
                style={{ animation: "locked-static 0.12s steps(2) infinite" }}
              />
            )}
          </svg>

          {/* Icon */}
          <span className="absolute inset-0 flex items-center justify-center text-paper">
            <NodeIcon
              kind={node.icon}
              className={locked ? "h-7 w-7 opacity-30" : "h-7 w-7"}
            />
          </span>

          {/* Diamond indicator on selected */}
          {selected && !locked && (
            <span
              aria-hidden="true"
              className="node-diamond-enter absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center"
            >
              <span className="h-2.5 w-2.5 rotate-45 bg-gold" />
            </span>
          )}
        </span>

        {/* Label — condensed/stencil typography */}
        <span
          className={`font-display text-[0.65rem] font-normal uppercase leading-none tracking-[0.14em] transition-colors ${
            selected
              ? "text-accent"
              : locked
                ? "text-paper/30"
                : "text-paper/70 group-hover:text-paper"
          }`}
        >
          {node.label}
        </span>
      </button>
    </div>
  );
}

/* ── Pipe connector layer — consistent duct system for all directions ── */

function ConnectorLayer({ size }: { size: { w: number; h: number } }) {
  const { w, h } = size;
  const reduced = useReducedMotion();
  if (w <= 0 || h <= 0) return null;

  const PIPE_W = 8;

  const cx = (n: SkillNode) => ({ x: (n.x / 100) * w, y: (n.y / 100) * h });

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={w}
      height={h}
      aria-hidden="true"
    >
      <defs>
        {/* Clip paths for traveling dots — keeps them inside pipes */}
        {SKILL_TREE.edges.map((edge, i) => {
          const from = SKILL_TREE.nodes.find((n) => n.id === edge.from);
          const to = SKILL_TREE.nodes.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          const a = cx(from);
          const b = cx(to);
          const hw = PIPE_W / 2;
          const isVertical = Math.abs(b.x - a.x) < 0.5;
          const isHorizontal = Math.abs(b.y - a.y) < 0.5;
          return (
            <clipPath key={`pc${i}`} id={`pipe-clip-${i}`}>
              {isVertical ? (
                <rect
                  x={a.x - hw}
                  y={Math.min(a.y, b.y)}
                  width={PIPE_W}
                  height={Math.abs(b.y - a.y)}
                />
              ) : isHorizontal ? (
                <rect
                  x={Math.min(a.x, b.x)}
                  y={a.y - hw}
                  width={Math.abs(b.x - a.x)}
                  height={PIPE_W}
                />
              ) : (
                <>
                  <rect
                    x={a.x - hw}
                    y={Math.min(a.y, b.y)}
                    width={PIPE_W}
                    height={Math.abs(b.y - a.y)}
                  />
                  <rect
                    x={Math.min(a.x, b.x)}
                    y={b.y - hw}
                    width={Math.abs(b.x - a.x)}
                    height={PIPE_W}
                  />
                  <rect
                    x={a.x - hw}
                    y={b.y - hw}
                    width={PIPE_W}
                    height={PIPE_W}
                  />
                </>
              )}
            </clipPath>
          );
        })}
      </defs>

      {SKILL_TREE.edges.map((edge, index) => {
        const from = SKILL_TREE.nodes.find((n) => n.id === edge.from);
        const to = SKILL_TREE.nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;

        const a = cx(from);
        const b = cx(to);
        const isFuture = edge.kind === "future";
        const hw = PIPE_W / 2;
        const isVertical = Math.abs(b.x - a.x) < 0.5;
        const isHorizontal = Math.abs(b.y - a.y) < 0.5;

        /* Traveling dot corner ratio */
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const cornerT =
          isVertical || isHorizontal
            ? 1
            : Math.abs(dy) / (Math.abs(dx) + Math.abs(dy) + 0.001);

        const borderFill = isFuture ? "#1a1a1a" : "#2a2a2a";
        const borderStroke = isFuture ? "rgba(245,245,240,0.1)" : "#333";
        const bodyFill = isFuture ? "#161616" : "#1c1c1c";
        const highlightStroke = isFuture
          ? "rgba(245,245,240,0.03)"
          : "rgba(245,245,240,0.06)";

        const seg = (
          <g
            key={index}
            style={{
              ["--connector-delay" as string]: `${index * 0.15 + 0.1}s`,
            }}
          >
            {isVertical ? (
              <>
                {/* Border */}
                <rect
                  x={a.x - hw}
                  y={Math.min(a.y, b.y)}
                  width={PIPE_W}
                  height={Math.abs(b.y - a.y)}
                  fill={borderFill}
                  stroke={borderStroke}
                  strokeWidth={1.5}
                  className="connector-draw"
                />
                {/* Body */}
                <rect
                  x={a.x - hw + 1.5}
                  y={Math.min(a.y, b.y)}
                  width={PIPE_W - 3}
                  height={Math.abs(b.y - a.y)}
                  fill={bodyFill}
                />
                {/* Center highlight */}
                <line
                  x1={a.x}
                  y1={Math.min(a.y, b.y)}
                  x2={a.x}
                  y2={Math.max(a.y, b.y)}
                  stroke={highlightStroke}
                  strokeWidth={1.5}
                />
              </>
            ) : isHorizontal ? (
              <>
                {/* Border */}
                <rect
                  x={Math.min(a.x, b.x)}
                  y={a.y - hw}
                  width={Math.abs(b.x - a.x)}
                  height={PIPE_W}
                  fill={borderFill}
                  stroke={borderStroke}
                  strokeWidth={1.5}
                  className="connector-draw"
                />
                {/* Body */}
                <rect
                  x={Math.min(a.x, b.x)}
                  y={a.y - hw + 1.5}
                  width={Math.abs(b.x - a.x)}
                  height={PIPE_W - 3}
                  fill={bodyFill}
                />
                {/* Center highlight */}
                <line
                  x1={Math.min(a.x, b.x)}
                  y1={a.y}
                  x2={Math.max(a.x, b.x)}
                  y2={a.y}
                  stroke={highlightStroke}
                  strokeWidth={1.5}
                />
              </>
            ) : (
              /* L-shape: vertical segment + horizontal segment + corner */
              <>
                {/* Vertical segment border */}
                <rect
                  x={a.x - hw}
                  y={Math.min(a.y, b.y)}
                  width={PIPE_W}
                  height={Math.abs(b.y - a.y)}
                  fill={borderFill}
                  stroke={borderStroke}
                  strokeWidth={1.5}
                  className="connector-draw"
                />
                {/* Vertical segment body */}
                <rect
                  x={a.x - hw + 1.5}
                  y={Math.min(a.y, b.y)}
                  width={PIPE_W - 3}
                  height={Math.abs(b.y - a.y)}
                  fill={bodyFill}
                />
                {/* Vertical center highlight */}
                <line
                  x1={a.x}
                  y1={Math.min(a.y, b.y)}
                  x2={a.x}
                  y2={Math.max(a.y, b.y)}
                  stroke={highlightStroke}
                  strokeWidth={1.5}
                />
                {/* Horizontal segment border */}
                <rect
                  x={Math.min(a.x, b.x)}
                  y={b.y - hw}
                  width={Math.abs(b.x - a.x)}
                  height={PIPE_W}
                  fill={borderFill}
                  stroke={borderStroke}
                  strokeWidth={1.5}
                  className="connector-draw"
                />
                {/* Horizontal segment body */}
                <rect
                  x={Math.min(a.x, b.x)}
                  y={b.y - hw + 1.5}
                  width={Math.abs(b.x - a.x)}
                  height={PIPE_W - 3}
                  fill={bodyFill}
                />
                {/* Horizontal center highlight */}
                <line
                  x1={Math.min(a.x, b.x)}
                  y1={b.y}
                  x2={Math.max(a.x, b.x)}
                  y2={b.y}
                  stroke={highlightStroke}
                  strokeWidth={1.5}
                />
                {/* Corner piece — covers junction */}
                <rect
                  x={a.x - hw}
                  y={b.y - hw}
                  width={PIPE_W}
                  height={PIPE_W}
                  fill={borderFill}
                  stroke={borderStroke}
                  strokeWidth={1.5}
                />
                <rect
                  x={a.x - hw + 1.5}
                  y={b.y - hw + 1.5}
                  width={PIPE_W - 3}
                  height={PIPE_W - 3}
                  fill={bodyFill}
                />
              </>
            )}

            {/* Pipe glow — direction-aware */}
            {!reduced && !isFuture && (
              <g style={{ filter: "blur(8px)" }}>
                {isVertical && (
                  <rect
                    x={a.x - 8}
                    y={Math.min(a.y, b.y) - 4}
                    width={16}
                    height={Math.abs(b.y - a.y) + 8}
                    fill="none"
                    stroke="rgba(230,0,18,0.1)"
                    strokeWidth={14}
                    rx={7}
                    style={{
                      animation: `pipe-glow-pulse 4s ease-in-out ${index * 0.5}s infinite`,
                    }}
                  />
                )}
                {isHorizontal && (
                  <rect
                    x={Math.min(a.x, b.x) - 4}
                    y={a.y - 8}
                    width={Math.abs(b.x - a.x) + 8}
                    height={16}
                    fill="none"
                    stroke="rgba(230,0,18,0.1)"
                    strokeWidth={14}
                    rx={7}
                    style={{
                      animation: `pipe-glow-pulse 4s ease-in-out ${index * 0.5}s infinite`,
                    }}
                  />
                )}
                {!isVertical && !isHorizontal && (
                  <>
                    <rect
                      x={a.x - 8}
                      y={Math.min(a.y, b.y) - 4}
                      width={16}
                      height={Math.abs(b.y - a.y) + 8}
                      fill="none"
                      stroke="rgba(230,0,18,0.1)"
                      strokeWidth={14}
                      rx={7}
                      style={{
                        animation: `pipe-glow-pulse 4s ease-in-out ${index * 0.5}s infinite`,
                      }}
                    />
                    <rect
                      x={Math.min(a.x, b.x) - 4}
                      y={b.y - 8}
                      width={Math.abs(b.x - a.x) + 8}
                      height={16}
                      fill="none"
                      stroke="rgba(230,0,18,0.1)"
                      strokeWidth={14}
                      rx={7}
                      style={{
                        animation: `pipe-glow-pulse 4s ease-in-out ${index * 0.5}s infinite`,
                      }}
                    />
                  </>
                )}
              </g>
            )}

            {/* Traveling dots */}
            {!reduced && !isFuture && (
              <g clipPath={`url(#pipe-clip-${index})`}>
                {/* Outer glow */}
                <circle
                  r={5}
                  fill="var(--color-accent)"
                  opacity={0}
                  style={{ filter: "blur(3px)" }}
                >
                  <animate
                    attributeName="cx"
                    values={`${a.x};${a.x};${b.x}`}
                    keyTimes={`0;${cornerT};1`}
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                  <animate
                    attributeName="cy"
                    values={`${a.y};${b.y};${b.y}`}
                    keyTimes={`0;${cornerT};1`}
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.7;0.7;0"
                    keyTimes="0;0.15;0.85;1"
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                {/* White core */}
                <circle
                  r={2}
                  fill="var(--color-paper)"
                  opacity={0}
                  style={{
                    filter: "drop-shadow(0 0 3px rgba(230,0,18,0.9))",
                  }}
                >
                  <animate
                    attributeName="cx"
                    values={`${a.x};${a.x};${b.x}`}
                    keyTimes={`0;${cornerT};1`}
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                  <animate
                    attributeName="cy"
                    values={`${a.y};${b.y};${b.y}`}
                    keyTimes={`0;${cornerT};1`}
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.15;0.85;1"
                    dur="3s"
                    begin={`${index * 0.8}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </g>
        );

        return seg;
      })}
    </svg>
  );
}

/* ── Detail panel — angular card with clipped corner ── */

function DetailPanel({ node }: { node: SkillNode }) {
  const locked = node.kind === "locked";

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DiamondMarker size={8} />
          <h3 className="font-display text-sm font-normal uppercase tracking-[0.2em] text-accent">
            Detalle
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {node.level && (
            <span className="inline-flex items-center border border-paper/20 bg-bg-hero px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-paper/60">
              {node.level}
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] ${
              locked
                ? "border border-paper/15 text-paper/40"
                : "bg-accent text-paper"
            }`}
          >
            {node.status}
          </span>
        </div>
      </div>

      <h4 className="mt-4 font-display text-2xl uppercase leading-tight text-paper">
        {node.title}
      </h4>

      {(node.period || node.institution) && (
        <dl className="mt-4 grid grid-cols-2 gap-4">
          {node.period && (
            <div>
              <dt className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-paper/40">
                Periodo
              </dt>
              <dd className="mt-1 text-sm font-medium text-paper/85">
                {node.period}
              </dd>
            </div>
          )}
          {node.institution && (
            <div>
              <dt className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-paper/40">
                Centro
              </dt>
              <dd className="mt-1 text-sm font-medium text-paper/85">
                {node.institution}
              </dd>
            </div>
          )}
        </dl>
      )}

      {node.detail && (
        <p className="mt-4 inline-flex items-center gap-2 border-l-2 border-accent pl-3 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-accent">
          {node.detail}
        </p>
      )}

      {node.description && (
        <p className="mt-4 max-w-2xl text-body leading-relaxed text-paper/75">
          {node.description}
        </p>
      )}
    </>
  );

  return (
    <div
      className="skill-tree-detail relative border border-paper/15 bg-bg-content-alt p-5 md:p-6"
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 1.2rem) 0, 100% 1.2rem, 100% 100%, 0 100%)",
      }}
    >
      {/* Red left edge accent */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
      />
      <div key={node.id} className="skill-panel-in">
        {content}
      </div>
    </div>
  );
}

/* ── Cursor diamond follower ── */

function CursorDiamond({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const pos = useMousePosition(containerRef);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    const enter = () => setVisible(true);
    const leave = () => setVisible(false);
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [containerRef]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-50 h-3 w-3 rotate-45 border border-accent/60 bg-accent/20"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%) rotate(45deg)",
        transition: "left 0.08s steps(3), top 0.08s steps(3)",
        animation: "cursor-diamond-pulse 1.8s ease-in-out infinite",
      }}
    />
  );
}

/* ── Progress counter ── */

function ProgressCounter() {
  const unlocked = SKILL_TREE.nodes.filter((n) => n.kind === "unlocked").length;
  const total = SKILL_TREE.nodes.length;

  return (
    <div className="flex items-center gap-2.5 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-paper/35">
      <span className="h-1.5 w-1.5 rotate-45 bg-accent/50" />
      <span>
        {unlocked} / {total} nodos desbloqueados
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN SECTION
   ════════════════════════════════════════════════════════════════ */
export function SkillTreeSection() {
  const { ref, size } = useContainerSize();
  const treeRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("bootcamp");

  const active =
    SKILL_TREE.nodes.find((node) => node.id === selected) ??
    SKILL_TREE.nodes[0];

  const handleSelect = useCallback((id: string) => {
    setSelected(id);
  }, []);

  return (
    <div className="skill-tree-section mt-6">
      <div className="mx-auto mb-4 max-w-4xl">
        <ProgressCounter />
      </div>

      <div
        ref={(el) => {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (treeRef as React.MutableRefObject<HTMLDivElement | null>).current =
            el;
        }}
        className="skill-tree-stage relative mx-auto h-[22rem] max-w-4xl sm:h-[24rem] lg:h-[26rem]"
      >
        {/* Side label — UI chrome density */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 top-1/2 z-20 select-none font-sans text-[0.5rem] uppercase tracking-[0.25em] text-paper/15"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          SKILL_TREE.SYS
        </span>

        <ConnectorLayer size={size} />
        <CursorDiamond containerRef={treeRef} />

        {SKILL_TREE.nodes.map((node, index) => (
          <NodeBadge
            key={node.id}
            node={node}
            index={index}
            selected={node.id === selected}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-4xl">
        <DetailPanel node={active} />
      </div>
    </div>
  );
}
