import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

/* ── Mulberry32 — fast, deterministic PRNG ──────────────── */

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

/* ── Particle interfaces ────────────────────────────────── */

interface Petal {
  id: string;
  left: number;
  w: number;
  h: number;
  color: string;
  delay: number;
  duration: number;
  blur: number;
  sway1: number;
  sway2: number;
  sway3: number;
  sway4: number;
  rot1: number;
  rot2: number;
  rot3: number;
  rot4: number;
  opacity: number;
}

const PETAL_COUNT = 30;
const PETAL_COLORS = ["#ffdce5", "#ffb3c5", "#ff8eaa", "#f47798"];

function generateParticles(): Petal[] {
  const rng = mulberry32(42);
  const petals: Petal[] = [];

  for (let i = 0; i < PETAL_COUNT; i++) {
    const baseW = randRange(rng, 10, 20);
    const baseH = baseW * randRange(rng, 1.25, 1.75);
    petals.push({
      id: `p${i}`,
      left: randRange(rng, -5, 105),
      w: baseW,
      h: baseH,
      color: PETAL_COLORS[Math.floor(rng() * PETAL_COLORS.length)],
      delay: -randRange(rng, 0, 28),
      duration: randRange(rng, 13, 26),
      blur: randRange(rng, 0, 0.7),
      sway1: randRange(rng, -60, 60),
      sway2: randRange(rng, -90, 90),
      sway3: randRange(rng, -70, 70),
      sway4: randRange(rng, -50, 50),
      rot1: randRange(rng, 0, 360),
      rot2: randRange(rng, 0, 360),
      rot3: randRange(rng, 0, 360),
      rot4: randRange(rng, 0, 360),
      opacity: randRange(rng, 0.24, 0.48),
    });
  }

  return petals;
}

function PetalSpan({ petal, reduced }: { petal: Petal; reduced: boolean }) {
  return (
    <span
      className="sakura-petal absolute"
      style={
        {
          left: `${petal.left}%`,
          width: `${petal.w}px`,
          height: `${petal.h}px`,
          opacity: reduced ? 0.2 : undefined,
          "--petal-color": petal.color,
          "--petal-blur": `${petal.blur}px`,
          "--sway1": `${petal.sway1}px`,
          "--sway2": `${petal.sway2}px`,
          "--sway3": `${petal.sway3}px`,
          "--sway4": `${petal.sway4}px`,
          "--rot1": `${petal.rot1}deg`,
          "--rot2": `${petal.rot2}deg`,
          "--rot3": `${petal.rot3}deg`,
          "--rot4": `${petal.rot4}deg`,
          "--petal-opacity": petal.opacity,
          animation: reduced
            ? "none"
            : `sakura-fall ${petal.duration}s linear ${petal.delay}s infinite`,
          transform: reduced
            ? `translateY(${12 + ((petal.id.charCodeAt(1) * 137) % 76)}vh) rotate(${petal.rot1}deg)`
            : undefined,
        } as React.CSSProperties
      }
    />
  );
}

/* ── Component ──────────────────────────────────────────── */

export function PetalBackground() {
  const reduced = useReducedMotion() ?? false;
  const particles = useMemo(generateParticles, []);

  return (
    <div
      aria-hidden="true"
      className="sakura-bg pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {particles.map((petal) => (
        <PetalSpan key={petal.id} petal={petal} reduced={reduced} />
      ))}
    </div>
  );
}
