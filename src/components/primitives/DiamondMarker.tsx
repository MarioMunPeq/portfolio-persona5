/**
 * Decorative diamond/rhombus marker — replaces the "◄" arrow character
 * for non-navigational eyebrow labels. A small square rotated 45°,
 * solid accent red fill. Used where the arrow was purely decorative
 * (not an actual navigation link).
 */
export function DiamondMarker({
  className = "",
  size = 7,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-accent ${className}`}
      style={{
        width: size,
        height: size,
        transform: "rotate(45deg)",
      }}
    />
  );
}
