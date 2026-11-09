/**
 * Configuracion de transicion por ruta.
 *
 * - "train": transicion de video del tren (comportamiento actual por defecto).
 * - "fade": fundido a negro sin tren. Se usa para /education.
 *
 * Las rutas no listadas usan "train".
 */
export type RouteTransitionType = "train" | "fade";

export const ROUTE_TRANSITIONS: Record<string, RouteTransitionType> = {
  "/education": "fade",
};

/** Devuelve el tipo de transicion para una ruta dada. */
export function routeTransitionType(pathname: string): RouteTransitionType {
  return ROUTE_TRANSITIONS[pathname] ?? "train";
}
