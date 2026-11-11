import { useRef } from "react";

/**
 * Devuelve una promesa que se resuelve cuando la transición de página ha
 * terminado.
 *
 * - Si `data-transition="done"` ya está en <html> (carga directa o
 *   transición ya resuelta), resuelve al instante.
 * - Si no, espera el evento `page-transition-done`.
 * - Seguridad: se resuelve solo a los 5s aunque nunca llegue el evento.
 */
export function useTransitionDone(): Promise<void> {
  const resolvedRef = useRef(false);

  if (typeof document !== "undefined" && !resolvedRef.current) {
    const attr = document.documentElement.getAttribute("data-transition");
    if (attr === "done") {
      resolvedRef.current = true;
      return Promise.resolve();
    }
  }

  return new Promise<void>((resolve) => {
    if (resolvedRef.current) {
      resolve();
      return;
    }

    const handleDone = () => {
      resolvedRef.current = true;
      resolve();
    };

    window.addEventListener("page-transition-done", handleDone, { once: true });

    const timer = setTimeout(() => {
      resolvedRef.current = true;
      resolve();
    }, 5000);

    return () => {
      window.removeEventListener("page-transition-done", handleDone);
      clearTimeout(timer);
    };
  });
}
