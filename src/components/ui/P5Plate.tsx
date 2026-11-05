/**
 * Placa angular reutilizable — 3 capas apiladas con el MISMO clip-path
 * (esquinas cortadas en diagonal):
 *   · capa 1 (sombra roja): #e8112d, translate(6px, 6px)
 *   · capa 2 (borde): #fff, tamaño completo
 *   · capa 3 (fondo): #111, inset 3px, mismo clip-path para borde uniforme.
 *
 * Sin borde CSS ni drop-shadow/filter sobre el clip-path (evitan puntos
 * rojos y blancos en las esquinas). Cada placa recibe una rotación leve
 * distinta (entre -3° y +2°) vía --p5-rot.
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
        <div className="p5-plate__shadow" />
        <div className="p5-plate__border" />
        <div className="p5-plate__fill" />
        <div className="p5-plate__inner" style={{ padding: pad || "var(--p5-pad)" }}>
          {children}
        </div>
      </div>
    </span>
  );
}
