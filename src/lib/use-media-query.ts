import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe hook that returns `true` when the given CSS media query matches.
 * Re-evaluates on window resize and when the query itself changes (por
 * ejemplo, si el usuario activa `prefers-reduced-motion` con la pagina
 * abierta).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      window.addEventListener("resize", callback);
      return () => {
        media.removeEventListener("change", callback);
        window.removeEventListener("resize", callback);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
