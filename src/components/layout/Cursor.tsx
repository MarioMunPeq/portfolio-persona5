import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import "./Cursor.css";

interface CursorState {
  active: boolean;
  label: string;
}

const RED = "#e60012";

// Etiqueta segun el contexto (data-cursor).
const CURSOR_STYLES: Record<string, CursorState> = {
  select: { active: true, label: "SELECCIONAR" },
  open: { active: true, label: "ABRIR" },
  project: { active: true, label: "VER PROYECTO" },
  contact: { active: true, label: "CONTACTO" },
  back: { active: true, label: "VOLVER" },
};

function resolveCursor(target: Element): CursorState {
  const cursorEl = target.closest("[data-cursor]") as HTMLElement | null;
  const key = cursorEl?.dataset.cursor;
  const style = key ? CURSOR_STYLES[key] : undefined;
  if (style) return style;
  // Fallback por semantica cuando no hay data-cursor.
  const href = target.closest("a")?.getAttribute("href") ?? "";
  if (href.startsWith("mailto:")) return CURSOR_STYLES.contact;
  if (href.includes("/proyectos")) return CURSOR_STYLES.project;
  if (href.includes("/contacto")) return CURSOR_STYLES.contact;
  if (href.split("#")[0].endsWith("/")) return CURSOR_STYLES.back;
  return CURSOR_STYLES.select;
}

// Curva rapida y cortante (ease-out exponencial).
const BEZIER: [number, number, number, number] = [0.16, 1, 0.3, 1];
// Snap del reticulo al cambiar de estado.
const SNAP = { duration: 0.18, ease: BEZIER };
// Compresion al pulsar, aun mas corta (~120 ms).
const PRESS = { duration: 0.12, ease: BEZIER };
// Entrada escalonada del texto contextual.
const TEXT_IN = { duration: 0.12, ease: "easeOut" as const, delay: 0.06 };
const TEXT_OUT = { duration: 0.06, ease: "easeIn" as const };
// Posicion de la etiqueta respecto al puntero.
const SLIDE = { duration: 0.14, ease: BEZIER };
// Rotacion lenta de los anillos, independiente del movimiento.
const SPIN = { duration: 6, ease: "linear" as const, repeat: Infinity };

// Separacion horizontal de la etiqueta respecto al puntero y ancho estimado
// (se reajusta con la medicion real del DOM).
const LABEL_GAP = 24;
const LABEL_EST = 150;

// Factor de easing del fantasma (mas alto = mas pegajoso al puntero).
const GHOST_EASING = 16;

/**
 * Cursor decorativo del sistema — "Phantom Lock". El reticulo rojo y negro
 * evoca el bloqueo de objetivo de un golpe, con una estela retrasada:
 *
 *  - El nucleo angular gira sobre anillos segmentados y se expande al apuntar.
 *  - La estela negra con contorno rojo sigue el puntero con retraso suavizado.
 *  - La etiqueta contextual entra como una banda cortada, al estilo P5.
 *
 * Con `prefers-reduced-motion` o puntero tactil no se monta: se usa el cursor
 * nativo. Cuando esta activo se marca `data-cursor-active` y CSS oculta el
 * nativo (solo punteros finos). La etiqueta contextual se recoloca al otro
 * lado del puntero cerca de los bordes y nunca sale de pantalla.
 */
export function Cursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({
    active: false,
    label: "SELECCIONAR",
  });
  const [pressed, setPressed] = useState(false);
  const [impact, setImpact] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [lift, setLift] = useState(0);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // Posicion del fantasma: se aproxima a (x, y) con easing por fotograma.
  const ghostX = useMotionValue(-100);
  const ghostY = useMotionValue(-100);

  const viewport = useRef({ w: 1280, h: 720 });
  const flipRef = useRef(false);
  const liftRef = useRef(0);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const labelWidth = useRef(LABEL_EST);

  // Anchura real de la etiqueta (con margen) para el volteo en los bordes.
  useEffect(() => {
    labelWidth.current = labelRef.current
      ? Math.max(LABEL_EST, labelRef.current.offsetWidth + 10)
      : LABEL_EST;
  }, [enabled, cursor.label]);

  useEffect(() => {
    if (reduced) return;

    const hoverQuery = window.matchMedia("(hover: none)");
    if (hoverQuery.matches) return;

    setEnabled(true);
    document.documentElement.setAttribute("data-cursor-active", "true");
    viewport.current = { w: window.innerWidth, h: window.innerHeight };
    ghostX.set(x.get());
    ghostY.set(y.get());

    const disable = () => {
      setEnabled(false);
      setCursor({ active: false, label: "" });
      setPressed(false);
      document.documentElement.removeAttribute("data-cursor-active");
    };

    const onResize = () => {
      viewport.current = { w: window.innerWidth, h: window.innerHeight };
    };

    const onMove = (event: MouseEvent) => {
      const { w, h } = viewport.current;
      const insetX = Math.min(24, w / 2);
      const insetY = Math.min(24, h / 2);
      x.set(Math.max(insetX, Math.min(event.clientX, w - insetX)));
      y.set(Math.max(insetY, Math.min(event.clientY, h - insetY)));

      // Recolocacion de la etiqueta segun el borde del viewport. Solo se
      // actualiza el estado al cruzar el umbral (nunca por fotograma).
      const flip = event.clientX > w - labelWidth.current - LABEL_GAP - 24;
      if (flip !== flipRef.current) {
        flipRef.current = flip;
        setFlipped(flip);
      }
      let next = 0;
      if (event.clientY < 64) next = 1;
      else if (event.clientY > h - 56) next = -1;
      if (next !== liftRef.current) {
        liftRef.current = next;
        setLift(next);
      }
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const interactive = target?.closest(
        'a, button, [role="button"], [data-cursor]',
      );
      if (!interactive) {
        setCursor((prev) => (prev.active ? { ...prev, active: false } : prev));
        return;
      }
      const next = resolveCursor(interactive);
      setCursor((prev) =>
        prev.active && prev.label === next.label ? prev : next,
      );
    };

    const onDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      setPressed(true);
      setImpact((previous) => previous + 1);
    };

    const onUp = () => setPressed(false);

    const onLeave = () => {
      setPressed(false);
      setCursor((prev) => (prev.active ? { ...prev, active: false } : prev));
    };

    /* Si el viewport cambia a un layout tactil (rotacion, resize),
       forzar el apagado completo del cursor custom. */
    const onHoverChange = (e: MediaQueryListEvent) => {
      if (e.matches) disable();
    };

    /* Desactivar inmediatamente al detectar cualquier interaccion tactil.
       Un solo touch en un dispositivo hibrido (ej. Surface) debe apagar
       el cursor custom para siempre en esa sesion. */
    const onTouchStart = () => disable();

    hoverQuery.addEventListener("change", onHoverChange);

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchstart", onTouchStart, {
      once: true,
      passive: true,
    });

    return () => {
      hoverQuery.removeEventListener("change", onHoverChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchstart", onTouchStart);
      document.documentElement.removeAttribute("data-cursor-active");
    };
  }, [reduced, x, y, ghostX, ghostY]);

  // Retraso del fantasma: easing exponencial hacia la posicion real del
  // puntero, una vez por fotograma (lag suave, no seguimiento 1:1).
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const k = 1 - Math.exp(-dt * GHOST_EASING);
      ghostX.set(ghostX.get() + (x.get() - ghostX.get()) * k);
      ghostY.set(ghostY.get() + (y.get() - ghostY.get()) * k);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, x, y, ghostX, ghostY]);

  if (!enabled) return null;

  const labelX = flipped ? -(labelWidth.current + LABEL_GAP) : LABEL_GAP;
  const labelY = lift === 1 ? 26 : lift === -1 ? -58 : -18;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000]"
        style={{ x: ghostX, y: ghostY }}
        animate={{
          opacity: cursor.active ? 0.9 : 0.58,
          scale: cursor.active ? 1.18 : 1,
        }}
        transition={SNAP}
      >
        <div className="cursor-echo -ml-[17px] -mt-[17px]">
          <span />
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10001]"
        style={{ x, y }}
      >
        <div className="relative -ml-6 -mt-6">
          <motion.div
            className="cursor-lock"
            data-active={cursor.active}
            animate={{
              scale: pressed ? 0.82 : cursor.active ? 1.12 : 1,
            }}
            transition={pressed ? PRESS : SNAP}
          >
            <motion.svg
              viewBox="0 0 48 48"
              className="cursor-lock-orbit"
              animate={{ rotate: 360 }}
              transition={SPIN}
            >
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke={RED}
                strokeWidth="1.5"
                strokeDasharray="49 9 13 9"
              />
              <path
                d="M24 1.5v5M24 41.5v5M1.5 24h5M41.5 24h5"
                fill="none"
                stroke={RED}
                strokeWidth="1.5"
              />
            </motion.svg>
            <motion.svg
              viewBox="0 0 48 48"
              className="cursor-lock-core"
              animate={{ rotate: -360 }}
              transition={{ ...SPIN, duration: 9 }}
            >
              <circle
                cx="24"
                cy="24"
                r="11"
                fill="#090909"
                stroke={RED}
                strokeWidth="1.4"
                strokeDasharray="2 3"
              />
              <path
                d="M24 15.5 32.5 24 24 32.5 15.5 24Z"
                fill="#090909"
                stroke={RED}
                strokeWidth="1.5"
              />
              <path
                d="M20 24h8M24 20v8"
                fill="none"
                stroke={RED}
                strokeWidth="1.3"
              />
              <circle cx="24" cy="24" r="2" fill={RED} />
            </motion.svg>
            <span className="cursor-lock-pulse" />
          </motion.div>

          <motion.span
            className="pointer-events-none absolute left-0 top-0"
            style={{
              transformOrigin: flipped ? "right center" : "left center",
            }}
            animate={{
              x: cursor.active ? labelX : labelX + (flipped ? -8 : 8),
              y: cursor.active ? labelY : labelY + 6,
              opacity: cursor.active ? 1 : 0,
              scaleX: cursor.active ? 1 : 0.7,
            }}
            transition={{
              ...SLIDE,
              opacity: {
                duration: cursor.active ? 0.16 : 0.1,
                ease: BEZIER,
              },
              scaleX: {
                duration: cursor.active ? 0.18 : 0.12,
                ease: BEZIER,
              },
            }}
          >
            <span className="cursor-label">
              <span className="cursor-label-mark" aria-hidden="true">
                <span />
              </span>
              <motion.span
                ref={labelRef}
                className={`cursor-label-text ${flipped ? "text-right" : ""}`}
                animate={{
                  opacity: cursor.active ? 1 : 0,
                  x: cursor.active ? 0 : flipped ? 5 : -5,
                }}
                transition={cursor.active ? TEXT_IN : TEXT_OUT}
              >
                {cursor.label}
              </motion.span>
            </span>
          </motion.span>

          {impact > 0 && (
            <motion.span
              key={impact}
              className="cursor-impact"
              initial={{ scale: 0.35, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              onAnimationComplete={() =>
                setImpact((current) => (current === impact ? 0 : current))
              }
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
