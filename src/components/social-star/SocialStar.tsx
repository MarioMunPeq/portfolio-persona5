const CX = 300;
const CY = 300;
const MAX_STAT_VALUE = 5;
const MIN_VALUE_RADIUS = 64;
const MAX_VALUE_RADIUS = 124;

function starVertices(
  values: readonly number[],
  outerRadius: (value: number) => number,
  innerRadius: number,
) {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const value = values[Math.floor(index / 2)] ?? 3;
    const radius = index % 2 === 0 ? outerRadius(value) : innerRadius;
    return {
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius,
    };
  });
}

export function SocialStar({
  className = "",
  values,
}: {
  className?: string;
  values: readonly number[];
}) {
  const outerStar = starVertices([5, 5, 5, 5, 5], () => 270, 116);
  const innerStar = starVertices(
    values,
    (value) =>
      MIN_VALUE_RADIUS +
      (value / MAX_STAT_VALUE) * (MAX_VALUE_RADIUS - MIN_VALUE_RADIUS),
    58,
  );
  const pointList = (points: { x: number; y: number }[]) =>
    points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const outerPoints = pointList(outerStar);
  const innerPoints = pointList(innerStar);
  const gemPoints = pointList(
    starVertices([5, 5, 5, 5, 5], () => 31, 15),
  );

  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      className={`h-full w-full ${className}`}
      fill="none"
    >
      <polygon
        points={outerPoints}
        fill="#080808"
        transform="translate(15 20)"
      />
      <polygon
        points={outerPoints}
        fill="#303034"
      />
      <polygon
        points={innerPoints}
        fill="#E89100"
      />

      {values.map((_, index) => {
        const tipIndex = index * 2;
        const tip = innerStar[tipIndex];
        const previousValley = innerStar[(tipIndex + 9) % 10];
        const nextValley = innerStar[(tipIndex + 1) % 10];

        return (
          <g key={`facet-${index}`}>
            <polygon
              points={pointList([{ x: CX, y: CY }, previousValley, tip])}
              fill={index % 2 === 0 ? "#FFD21A" : "#F5A900"}
            />
            <polygon
              points={pointList([{ x: CX, y: CY }, tip, nextValley])}
              fill={index % 2 === 0 ? "#F5A900" : "#FFD21A"}
            />
          </g>
        );
      })}
      <polygon
        points={gemPoints}
        fill="#FFE34A"
      />
    </svg>
  );
}
