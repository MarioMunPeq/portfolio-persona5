/**
 * Placa angular reutilizable — técnica EXACTAMENTE igual que los botones
 * del menú principal (Perfil, Inventario…): clip-path poligonal con esquinas
 * cortadas en diagonal, borde blanco (capa exterior #fff + capa interior #111
 * con el mismo clip-path a inset 3px), fondo #111 y sombra roja desplazada
 * en el wrapper padre.
 *
 * Cada placa recibe una rotación distinta pequeña (entre -3° y +2°) vía
 * --p5-rot, y el contenido se contra-inclina para que se lea recto.
 */
export function P5Plate({
  children,
  className = "",
  rot = 0,
  pad,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Rotación en grados (-3 a 2 recomendado). */
  rot?: number;
  /** Padding CSS (usa --p5-pad por defecto). */
  pad?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`p5-plate-wrap ${className}`}
      style={{ "--p5-rot": `${rot}deg`, ...style } as unknown as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="p5-plate">
        <div className="p5-plate__fill" />
        <div className="p5-plate__inner" style={{ padding: pad || "var(--p5-pad)" }}>
          {children}
        </div>
      </div>
    </span>
  );
}
