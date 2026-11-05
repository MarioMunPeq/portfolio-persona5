import { useEffect, useState } from "react";

export interface BootAssets {
  /** 0 → 1: fraccion REAL de recursos listos. */
  ratio: number;
  /** Todos los recursos resueltos (o salto el seguro de tiempo). */
  ready: boolean;
}

/**
 * Pesos relativos de cada tarea. Las fuentes y el evento `load` de la
 * ventana son lo que mas tarda en una primera visita; las imagenes del
 * splash se descargan en paralelo y pesan menos.
 */
const FONTS_WEIGHT = 3;
const WINDOW_WEIGHT = 3;
const FRAME_WEIGHT = 1;
const SOURCE_WEIGHT = 2;

/** Nunca dejar el splash colgado de un recurso que no responde. */
const SAFETY_MS = 8000;

const NO_SOURCES: readonly string[] = [];

/**
 * Mide la carga real de lo que necesita el splash: fuentes, `window.load`
 * y decode de las imagenes que se pintan en la pantalla de carga.
 *
 * El progreso es monotono (nunca retrocede) y `ready` solo se marca
 * cuando todas las tareas han terminado — con un seguro de tiempo para
 * que un asset roto no deje la portada bloqueada.
 */
export function useBootAssets(
  sources: readonly string[] = NO_SOURCES,
): BootAssets {
  const [state, setState] = useState<BootAssets>({ ratio: 0, ready: false });

  useEffect(() => {
    let cancelled = false;
    let done = 0;

    const total =
      FONTS_WEIGHT +
      WINDOW_WEIGHT +
      FRAME_WEIGHT +
      sources.length * SOURCE_WEIGHT;

    const publish = () => {
      if (cancelled) return;
      const ratio = Math.min(1, done / total);
      setState((prev) =>
        prev.ready
          ? prev
          : {
              ratio: Math.max(prev.ratio, ratio),
              ready: done >= total,
            },
      );
    };

    const bump = (weight: number) => {
      done += weight;
      publish();
    };

    /* 1. Fuentes tipograficas */
    if ("fonts" in document) {
      document.fonts.ready.then(
        () => bump(FONTS_WEIGHT),
        () => bump(FONTS_WEIGHT),
      );
    } else {
      bump(FONTS_WEIGHT);
    }

    /* 2. Todos los recursos de la pagina (imagenes, CSS, video poster) */
    const onWindowLoad = () => bump(WINDOW_WEIGHT);
    if (document.readyState === "complete") {
      bump(WINDOW_WEIGHT);
    } else {
      window.addEventListener("load", onWindowLoad, { once: true });
    }

    /* 3. Primer frame realmente pintado */
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => bump(FRAME_WEIGHT));
    });

    /* 4. Imagenes propias del splash (el error tambien cuenta como fin) */
    sources.forEach((src) => {
      const img = new Image();
      const settle = () => bump(SOURCE_WEIGHT);
      img.addEventListener("load", settle, { once: true });
      img.addEventListener("error", settle, { once: true });
      img.src = src;
    });

    /* 5. Seguro: forzar la salida aunque algo no responda */
    const safety = window.setTimeout(() => {
      if (cancelled) return;
      done = total;
      publish();
    }, SAFETY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onWindowLoad);
    };
  }, [sources]);

  return state;
}
