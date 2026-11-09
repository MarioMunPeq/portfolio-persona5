import { useEffect, useRef } from "react";

/**
 * Overlay de fundido a negro para transiciones por ruta.
 *
 * Es un singleton que permanece montado (como el video de transicion).
 * Se controla mediante `fadeBus.fadeInThenOut()` que:
 *  1. Funda a negro durante 0.3s
 *  2. Resuelve para que el llamador monte la pagina de destino bajo el negro
 *  3. Funda desde negro durante 0.35s
 *  4. Resuelve de nuevo cuando el negro se ha retirado por completo
 *
 * Al terminar se emite `page-transition-done` y se establece
 * `data-transition="done"` en <html>, igual que hace el video del tren.
 */
export function FadeTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.style.opacity = "0";
  }, []);

  return (
    <div
      id="fade-transition-overlay"
      ref={overlayRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
        opacity: "0",
        pointerEvents: "none",
        zIndex: 9998,
        transition: "opacity 0.35s linear",
      }}
    />
  );
}

type FadePhase = "in" | "out";

/**
 * Anima el overlay de fundido a negro.
 *
 * @param phase "in"  -> opacidad 0 a 1 (0.3s)
 * @param phase "out" -> opacidad 1 a 0 (0.35s)
 * Devuelve una promesa que se resuelve cuando la animacion termina.
 */
export function animateFade(phase: FadePhase): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.getElementById("fade-transition-overlay") as HTMLDivElement | null;
    if (!overlay) {
      resolve();
      return;
    }

    overlay.style.pointerEvents = "auto";
    const target = phase === "in" ? "1" : "0";
    const duration = phase === "in" ? 300 : 350;

    overlay.style.transition = `opacity ${duration}ms linear`;
    overlay.style.opacity = target;

    const onEnd = () => {
      overlay.removeEventListener("transitionend", onEnd);
      overlay.style.pointerEvents = "none";
      resolve();
    };

    overlay.addEventListener("transitionend", onEnd, { once: true });

    // Fallback si el evento no dispara
    setTimeout(() => {
      overlay.removeEventListener("transitionend", onEnd);
      overlay.style.pointerEvents = "none";
      resolve();
    }, duration + 100);
  });
}

/**
 * Ejecuta el ciclo completo de fundido para una transicion por ruta:
 * entra a negro (0.3s) -> resuelve -> sale de negro (0.35s) -> resuelve.
 * Al finalizar emite page-transition-done y pone data-transition="done".
 */
export async function fadeInThenOut(): Promise<void> {
  await animateFade("in");

  // Punto de insercion: la pagina de destino ya esta montada bajo el negro.

  await animateFade("out");

  document.documentElement.setAttribute("data-transition", "done");
  window.dispatchEvent(new CustomEvent("page-transition-done"));
}
