# Contexto del proyecto
Portfolio personal con estetica Persona 5. React + Vite + TypeScript, GSAP, Lenis (scroll del documento).
Fuentes: p5hatty (titulos recortados), Anton (texto condensado). Colores: #e8112d, #111, blanco.
Componentes reutilizables: Screen, SectionTitle (persona), PageBackground, .p5-plate (placas de 3 capas, sin filter sobre clip-path).
Reglas: scroll siempre del documento (sin overflow auto ni alturas fijas), padding-bottom calc(var(--bottombar-h) + 24px), GSAP dentro de gsap.context con revert, respetar prefers-reduced-motion.
Idioma: razona y responde siempre en español.
Verificacion: usa Playwright para capturas y comprobaciones de layout; si no puedes ver o ejecutar, dilo y para.