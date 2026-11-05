import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor visual de pantalla de ruta, sin animaciones de entrada/salida.
 */
export function Screen({ children, className }: ScreenProps) {
  return <div className={className}>{children}</div>;
}
