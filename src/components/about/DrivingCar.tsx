import { useReducedMotion } from "motion/react";

/**
 * "Permiso de conducir B" — vista lateral de un coupe en la paleta del
 * portfolio.
 *
 * El SVG se dibuja con cuatro capas: sombra en el suelo, huecos de rueda,
 * ruedas (con neumatico, banda de rodadura, llanta de cinco radios y buje
 * rojo) y carroceria recortada por una mascara que abre los pasos de
 * rueda. Todo son formas planas: paper para la chapa, ink para cristales y
 * bajos, accent para luces, faldon, linea de cintura y bujes.
 *
 * La animacion es CSS pura y solo toca transform: ruedas girando sobre su
 * centro, carroceria con un rebote de 1-2 px, estelas que salen hacia atras
 * y una calzada con dos filas de marcas a distinta velocidad (parallax).
 *
 * Con `prefers-reduced-motion` el coche queda perfectamente visible y
 * estatico (sin giro, sin rebote, sin estelas ni marcas en movimiento).
 */
export function DrivingCar({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`car-scene ${className}`}
      data-static={reduced ? "true" : "false"}
    >
      {/* Calzada: banda oscura con filo rojo y dos filas de marcas. */}
      <span className="car-road">
        <span className="car-road__lane car-road__lane--far" />
        <span className="car-road__lane car-road__lane--near" />
      </span>

      {/* Coche + estelas, alineados por la base de las ruedas. */}
      <span className="car-rig">
        <span className="car-speed">
          <span />
          <span />
          <span />
          <span />
        </span>

        <span className="car-bob">
          <svg
            viewBox="0 0 380 136"
            className="car-svg"
            preserveAspectRatio="xMidYMax meet"
            focusable="false"
          >
            <defs>
              {/* Mascara de pasos de rueda: recorta la chapa en dos circulos
                  para que el neumatico asome por el arco. */}
              <mask
                id="car-arch-mask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="380"
                height="136"
              >
                <rect width="380" height="136" fill="#fff" />
                <circle cx="98" cy="112" r="27" fill="#000" />
                <circle cx="286" cy="112" r="27" fill="#000" />
              </mask>

              {/* Rueda reutilizable: neumatico, banda de rodadura, llanta,
                  cinco radios y buje rojo. */}
              <g id="car-wheel">
                <circle cx="0" cy="0" r="22" fill="#0a0a0a" />
                <circle
                  cx="0"
                  cy="0"
                  r="18.5"
                  fill="none"
                  stroke="#2e2e2e"
                  strokeWidth="3"
                  strokeDasharray="3 4"
                />
                <circle cx="0" cy="0" r="13" fill="#f5f5f0" />
                <circle cx="0" cy="0" r="10.8" fill="#0a0a0a" />
                {[0, 72, 144, 216, 288].map((angle) => (
                  <rect
                    key={angle}
                    x="-2.4"
                    y="-10.8"
                    width="4.8"
                    height="8.6"
                    rx="1"
                    fill="#f5f5f0"
                    transform={`rotate(${angle})`}
                  />
                ))}
                <circle cx="0" cy="0" r="3.4" fill="#e60012" />
                <circle cx="0" cy="0" r="1.2" fill="#f5f5f0" />
              </g>
            </defs>

            {/* Sombra aplastada en el asfalto. */}
            <ellipse
              cx="192"
              cy="134"
              rx="158"
              ry="2.4"
              fill="#000000"
              opacity="0.55"
            />

            {/* Huecos oscuros: detras de la rueda para que el arco no deje
                ver la calzada. */}
            <circle cx="98" cy="112" r="27" fill="#080808" />
            <circle cx="286" cy="112" r="27" fill="#080808" />

            {/* Ruedas (detras de la chapa, asomando por los arcos). El giro
                se aplica al <use>, cuyo origen local es el centro exacto de
                la rueda, y no al grupo que la posiciona. */}
            <g className="car-wheel-mount" transform="translate(98 112)">
              <use href="#car-wheel" className="car-wheel" />
            </g>
            <g className="car-wheel-mount" transform="translate(286 112)">
              <use href="#car-wheel" className="car-wheel" />
            </g>

            {/* Carroceria. */}
            <g mask="url(#car-arch-mask)">
              <path
                d="M36 100 L36 78 Q38 68 52 64 L94 57 Q102 56 106 51 L124 32 Q129 27 138 27 L214 27 Q224 27 230 33 L254 54 Q259 58 268 60 L328 69 Q341 71 345 79 L347 88 Q348 96 341 100 Z"
                fill="#f5f5f0"
              />

              {/* Bajo sombreado + faldon rojo. */}
              <path
                d="M38 100 L341 100 L340 92 L39 92 Z"
                fill="#cfcfc7"
              />
              <path d="M54 100 L334 100 L334 97 L54 97 Z" fill="#e60012" />

              {/* Cristales: parabrisas, luna trasera y pilar B. */}
              <path
                d="M108 54 L126 35 L214 35 L246 56 Z"
                fill="#0a0a0a"
              />
              <path d="M174 35 L186 35 L186 56 L174 56 Z" fill="#f5f5f0" />
              <path
                d="M118 51 L132 37"
                stroke="#f5f5f0"
                strokeWidth="2"
                opacity="0.35"
              />
              <path
                d="M196 37 L205 46"
                stroke="#f5f5f0"
                strokeWidth="2"
                opacity="0.2"
              />

              {/* Linea de cintura roja, puerta y manilla. */}
              <path
                d="M64 64 L326 72"
                stroke="#e60012"
                strokeWidth="2.2"
              />
              <path
                d="M200 61 L196 97"
                stroke="#0a0a0a"
                strokeWidth="1.4"
                opacity="0.45"
              />
              <path
                d="M202 75 L219 76"
                stroke="#0a0a0a"
                strokeWidth="2.6"
                opacity="0.85"
                strokeLinecap="round"
              />

              {/* Piloto trasero. */}
              <path d="M40 70 L52 73 L52 80 L40 77 Z" fill="#e60012" />
              <path
                d="M41 73 L50 75"
                stroke="#f5f5f0"
                strokeWidth="1"
                opacity="0.55"
              />

              {/* Faro delantero, parrilla y splitter. */}
              <path d="M318 68 L342 75 L342 82 L318 76 Z" fill="#0a0a0a" />
              <path d="M321 70 L338 75 L338 78 L321 74 Z" fill="#e60012" />
              <path
                d="M321 70 L332 73"
                stroke="#f5f5f0"
                strokeWidth="1.4"
                opacity="0.7"
              />
              <path
                d="M332 86 L346 88 M332 90 L346 92"
                stroke="#0a0a0a"
                strokeWidth="1.8"
              />
              <path d="M334 96 L348 96 L348 100 L332 100 Z" fill="#e60012" />

              {/* Retrovisor. */}
              <path d="M248 51 L262 53 L262 60 L250 58 Z" fill="#0a0a0a" />
              <path d="M248 51 L255 52 L255 55 L248 54 Z" fill="#e60012" />

              {/* Labio del paso de rueda. */}
              <path
                d="M71 112 A 27 27 0 0 1 125 112"
                fill="none"
                stroke="#0a0a0a"
                strokeWidth="2.4"
              />
              <path
                d="M259 112 A 27 27 0 0 1 313 112"
                fill="none"
                stroke="#0a0a0a"
                strokeWidth="2.4"
              />
            </g>
          </svg>
        </span>
      </span>
    </div>
  );
}
