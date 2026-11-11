export interface ProjectImage {
  src: string;
  alt: string;
}

export interface ProjectScreenshot {
  /** null = captura pendiente: se muestra el placeholder en la galeria. */
  src: string | null;
  alt: string;
  /** Texto opcional que describe la captura. */
  caption?: string;
}

export interface ProjectFeature {
  name: string;
  description: string;
}

export interface ProjectConceptBlock {
  title: string;
  paragraphs: string[];
  highlights?: string[];
}

export interface ProjectArchitectureLayer {
  number: string;
  title: string;
  description: string;
}

export interface Project {
  slug: string;
  name: string;
  summary: string;
  description: string;
  /** Subtitulo bajo el nombre (e.g. "D&D 5e companion · Mobile-first · Offline-first"). */
  tagline?: string;
  /** Version del proyecto (e.g. "0.1.0"). */
  version?: string;
  stack: string[] | null;
  links: {
    demo: string | null;
    github: string | null;
  };
  images: ProjectImage[] | null;
  screenshots: ProjectScreenshot[] | null;
  /** Lista de features clave del proyecto. */
  features?: ProjectFeature[];
  /** Bloque conceptual (e.g. "Why Offline-First?"). */
  conceptBlock?: ProjectConceptBlock;
  /** Seccion de design system / ingenieria. */
  designSystem?: {
    title: string;
    description: string;
    points: string[];
  };
  /** Arquitectura del proyecto. */
  architecture?: {
    title: string;
    description?: string;
    layers: ProjectArchitectureLayer[];
  };
  /** Linea de cierre (e.g. "Built to disappear into the table"). */
  closingLine?: string;
  /** Label del CTA final. */
  ctaLabel?: string;
  /** URL del CTA final. */
  ctaUrl?: string;
  /** Bloque "Mi rol / Aportacion". */
  role?: {
    title: string;
    items: string[];
  };
  /** Bloque "Retos tecnicos". */
  challenges?: {
    title: string;
    items: { label: string; detail: string }[];
  };
}

export const projects: Project[] = [
  {
    slug: "dungeon-archive",
    name: "Dungeon Archive",
    summary:
      "Una PWA rapida e instalable que pone la referencia de D&D 5e al alcance de la mesa sin depender de una conexion a Internet.",
    description:
      "Un compañero rapido, pensado primero para movil y diseñado para funcionar sin conexion, para las sesiones de D&D 5e. Pone toda la referencia del juego —hechizos, monstruos, equipo, condiciones, acciones, objetos magicos y dotes— en el telefono que ya esta sobre la mesa, y mantiene el contexto esencial de la partida —tu grupo, la sesion actual y el estado del combate— a un toque de distancia. Su unico proposito es reducir el tiempo muerto en la mesa: el intervalo entre que surge una pregunta y se encuentra la respuesta.",
    tagline: "D&D 5e companion · Mobile-first · Offline-first",
    version: "0.1.0",
    stack: [
      "TypeScript",
      "React",
      "Vite",
      "Tailwind CSS",
      "React Router",
      "Zustand",
      "PWA",
      "Firebase",
    ],
    links: {
      demo: "https://mariomunpeq.github.io/Dungeon-Archive/",
      github: "https://github.com/mariomunpeq/Dungeon-Archive",
    },
    images: [
      {
        src: "/images/projects/dungeon-archive/home.png",
        alt: "Dungeon Archive home screen",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/dungeon-archive/home.png",
        alt: "Dungeon Archive home screen",
        caption: "Home",
      },
      {
        src: "/images/projects/dungeon-archive/character.png",
        alt: "Character manager",
        caption: "Character",
      },
      {
        src: "/images/projects/dungeon-archive/combat.png",
        alt: "Combat tracker",
        caption: "Combat",
      },
      {
        src: "/images/projects/dungeon-archive/dice.png",
        alt: "Dice roller",
        caption: "Dice roller",
      },
      {
        src: "/images/projects/dungeon-archive/backup.png",
        alt: "Cloud Backup screen",
        caption: "Backup",
      },
    ],
    features: [
      {
        name: "Busqueda instantanea",
        description:
          "Una unica busqueda para todo el Compendio. Los resultados aparecen mientras escribes gracias a un indice construido previamente y mantenido en memoria, sin red ni servidor.",
      },
      {
        name: "Compendio sin conexion",
        description:
          "Toda la referencia del SRD de D&D 5e —hechizos, monstruos, equipo, condiciones, acciones, objetos magicos y dotes— esta integrada en la aplicacion durante el proceso de compilacion y disponible sin conexion.",
      },
      {
        name: "Relaciones entre entidades",
        description:
          "Las entidades estan conectadas entre si. Un hechizo muestra las condiciones relacionadas y un monstruo muestra los hechizos y el equipo que utiliza o referencia.",
      },
      {
        name: "Gestion de personajes",
        description:
          "Hojas de referencia ligeras para jugadores: nombre, clase, nivel, caracteristicas y referencias a hechizos, armas y objetos magicos conocidos.",
      },
      {
        name: "Seguimiento de combate",
        description:
          "Puntos de golpe por personaje con ajustes rapidos de daño y curacion, panel de condiciones activables con un toque y acceso inmediato a las estadisticas de combate mas consultadas.",
      },
      {
        name: "Tirada de dados",
        description:
          "Permite lanzar cualquier dado tantas veces como sea necesario, con modificador opcional. Los dados de daño de los hechizos tambien pueden lanzarse directamente desde la hoja de personaje.",
      },
      {
        name: "Marcadores de sesion",
        description:
          "Guarda monstruos, hechizos y objetos en la sesion actual con un solo toque y permite eliminarlos todos al finalizar la sesion.",
      },
      {
        name: "Favoritos y recientes",
        description:
          "Marca entidades como favoritas y recuerda lo que has consultado y buscado recientemente.",
      },
      {
        name: "Modo principiante",
        description:
          "Activa consejos que explican conceptos como el d20, las pruebas de caracteristica y que puedes hacer durante tu turno de combate.",
      },
      {
        name: "Referencia de reglas",
        description:
          "Una referencia integrada para turnos de combate, ataques, puntos de golpe, descansos y lanzamiento de hechizos, ademas de un glosario explicado en lenguaje sencillo.",
      },
      {
        name: "Copia de seguridad en la nube",
        description:
          "Inicio de sesion opcional con Google para subir y restaurar manualmente los datos locales mediante Firestore. El resto de la aplicacion funciona completamente sin conexion.",
      },
      {
        name: "Aplicacion web progresiva",
        description:
          "PWA instalable, con almacenamiento en cache sin conexion mediante un service worker. Funciona completamente offline y no requiere una cuenta.",
      },
    ],
    conceptBlock: {
      title: "¿Por que funciona sin conexion?",
      paragraphs: [
        "Durante una sesion, la informacion suele estar repartida entre libros, PDFs y hojas de calculo. Encontrar algo lleva tiempo y, mientras alguien busca la respuesta, la mesa espera.",
        "Dungeon Archive incluye todo el Compendio dentro de la propia aplicacion, por lo que las consultas nunca dependen de la conexion a Internet.",
      ],
      highlights: [
        "Sin cuenta",
        "Sin conexion a Internet",
        "Datos almacenados localmente",
        "Copia de seguridad opcional en la nube",
      ],
    },
    designSystem: {
      title: "Sistema de diseño",
      description:
        "La interfaz sigue un sistema de diseño documentado en lugar de evolucionar como una coleccion de pantallas independientes.",
      points: [
        "Grid de espaciado de 4 px",
        "Radios consistentes por niveles",
        "Sistema de animaciones compartido",
        "Siete temas de acento",
        "Contraste WCAG AA",
        "Estados de foco visibles",
        "Diseño mobile-first",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "Una aplicacion cliente de una sola pagina dividida en tres capas desacopladas.",
      layers: [
        {
          number: "01",
          title: "Compendio",
          description:
            "Datos de referencia de D&D 5e generados durante el proceso de compilacion: 7 categorias, identificadores canonicos estables e indice de relaciones entre entidades.",
        },
        {
          number: "02",
          title: "Estado del usuario",
          description:
            "Estado local versionado y persistido en localStorage. Incluye favoritos, marcadores de sesion, hojas de personaje y preferencias.",
        },
        {
          number: "03",
          title: "Aplicacion React",
          description:
            "Paginas funcionales e interacciones coordinadas mediante React Router y construidas sobre el sistema de diseño.",
        },
      ],
    },
    closingLine:
      "La aplicacion se consulta y despues se aparta. Nunca deberia ser el motivo por el que una sesion se ralentiza.",
    ctaLabel: "Abrir Dungeon Archive",
    ctaUrl: "https://mariomunpeq.github.io/Dungeon-Archive/",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseño y arquitectura completa de la aplicacion, desde la estrategia offline-first hasta la estructura de componentes.",
        "Implementacion del sistema de busqueda: indice en memoria construido en tiempo de compilacion para resultados instantaneos sin servidor.",
        "Diseño del sistema de diseño propio con grid de 4 px, temas de acento y animaciones compartidas.",
        "Gestion del estado local con Zustand y persistencia en localStorage con versionado.",
        "Configuracion del service worker y estrategia de cache para funcionamiento completo sin conexion.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Offline-first",
          detail:
            "Diseñar una arquitectura que funcione completamente sin Internet, con sincronizacion opcional a la nube.",
        },
        {
          label: "Indice de busqueda",
          detail:
            "Construir un indice en memoria durante la compilacion que permita busquedas instantaneas entre miles de entidades.",
        },
        {
          label: "Persistencia local",
          detail:
            "Implementar un sistema de versionado de estado en localStorage que mantenga la integridad de los datos entre sesiones.",
        },
        {
          label: "Service worker",
          detail:
            "Configurar una estrategia de cache que mantenga la aplicacion funcional sin conexion y se actualice en segundo plano.",
        },
      ],
    },
  },
  {
    slug: "euromario",
    name: "Euromario",
    summary:
      "Un radar de noticias de videojuegos que filtra el ruido, agrupa las historias duplicadas y usa IA para resumir y priorizar solo lo que importa, publicado como web estatica sin infraestructura de pago.",
    description:
      "Un digest de noticias de videojuegos automatizado y sin infraestructura, construido como proyecto de portafolio alrededor de una pregunta: «¿Que ha pasado en los juegos que de verdad me interesan?». Recoge continuamente noticias de publicaciones especializadas, del feed oficial de Steam y de la comunidad de Reddit; las filtra contra una lista curada de juegos seguidos; agrupa los articulos relacionados en historias; enriquece las supervivientes con IA —resumen, relevancia del 1 al 5 y categoria— y publica el resultado como un frontend vanilla alojado en GitHub Pages. El proyecto evita deliberadamente un backend, una base de datos y cualquier infraestructura de pago: el repositorio actua como almacen de datos, GitHub Actions como programador y GitHub Pages como servidor estatico.",
    tagline:
      "Radar de noticias de videojuegos · Sin infraestructura · Actualizado cada hora",
    stack: [
      "Python",
      "JavaScript",
      "HTML/CSS",
      "RSS",
      "GitHub Actions",
      "GitHub Pages",
      "Ollama",
      "Groq",
    ],
    links: {
      demo: "https://mariomunpeq.github.io/Euromario/",
      github: "https://github.com/mariomunpeq/Euromario",
    },
    images: [
      {
        src: "/images/projects/euromario/main.png",
        alt: "Vista principal del radar de noticias de Euromario",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/euromario/main.png",
        alt: "Captura de la vista principal del radar de noticias de Euromario",
        caption: "Logo",
      },
      {
        src: "/images/projects/euromario/banner.png",
        alt: "Banner de Euromario",
        caption: "Visualizacion principal",
      },
    ],
    features: [
      {
        name: "Multiples fuentes de noticias",
        description:
          "IGN, Eurogamer, PC Gamer, Polygon y Rock Paper Shotgun via RSS, el feed oficial de Steam a traves de su API y la cobertura de la comunidad desde subreddits.",
      },
      {
        name: "Filtrado de ruido",
        description:
          "Patrones de exclusion de titulos y URLs, listas negras de juegos y emparejado con limites de palabra para evitar falsos positivos como GTA dentro de otra cadena.",
      },
      {
        name: "Seguimiento curado de juegos",
        description:
          "Cada juego seguido se configura en YAML con nombre canonico, alias, logo y plataformas. Añadir un juego no requiere tocar codigo Python.",
      },
      {
        name: "Agrupacion de historias",
        description:
          "Cuando varias redacciones cubren el mismo evento, el pipeline agrupa los articulos en una unica historia representativa antes de pasar a la IA.",
      },
      {
        name: "Resumen y puntuacion con IA",
        description:
          "Cada historia sobreviviente recibe un resumen breve, una relevancia del 1 al 5 y una categoria: lanzamiento, actualizacion, rumor o analisis.",
      },
      {
        name: "Fallos controlados de IA",
        description:
          "La salida del modelo se valida antes de publicarse. Si Ollama falla, el pipeline cambia a Groq y reintenta sin romper la ejecucion; Reddit siempre se publica como rumor sin esperar al modelo.",
      },
      {
        name: "Limite previo a la IA",
        description:
          "El tope de historias por juego se aplica antes y despues de la inferencia: en una ejecucion real redujo las llamadas de 64 a 13 sin sacrificar la seleccion final.",
      },
      {
        name: "Publicacion sin infraestructura",
        description:
          "Sin backend ni base de datos: el repositorio actua como almacen, GitHub Actions como programador y GitHub Pages como hosting estatico a coste cero.",
      },
      {
        name: "Automatizacion por hora",
        description:
          "GitHub Actions ejecuta el pipeline cada hora, confirma los datos generados y despliega el frontend solo cuando todos los pasos han terminado correctamente.",
      },
      {
        name: "Frontend sin dependencias",
        description:
          "HTML, CSS y JavaScript vanilla sin framework ni paso de compilacion, con estados de carga, error y vacio, filtros de juego, plataforma y categoria, y sincronizacion de la URL.",
      },
    ],
    conceptBlock: {
      title: "¿Por que sin infraestructura?",
      paragraphs: [
        "Un digest de noticias vale por lo reciente que es: lo que tiene mas de 48 horas no deberia seguir ahi. Mantener un backend y una base de datos solo para servir un JSON que se renueva cada hora seria infraestructura sin sentido.",
        "El repositorio en si es el almacen de datos, GitHub Actions es el programador y el encargado de publicar, y GitHub Pages sirve el frontend estatico. El sistema se mantiene por si solo y no hay servidor que mantener encendido.",
      ],
      highlights: [
        "Sin backend",
        "Sin base de datos",
        "Sin servidor siempre activo",
        "Coste cero",
        "Publicado cada hora",
      ],
    },
    designSystem: {
      title: "Frontend",
      description:
        "Una interfaz estatica y ligera que carga un unico JSON y se pinta en el cliente, sin framework ni paso de compilacion.",
      points: [
        "HTML, CSS y JS vanilla",
        "Tema oscuro #0A0A0B",
        "Tipografia Archivo Black",
        "Estados de carga, error y vacio",
        "Semantica ARIA y roles",
        "Carousel de filtros responsive",
        "Vistas sincronizadas por URL",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "Un pipeline Python por etapas que reduce el ruido de forma progresiva, seguido de un frontend estatico que solo consume el JSON resultante.",
      layers: [
        {
          number: "01",
          title: "Recoleccion",
          description:
            "RSS de IGN, Eurogamer, PC Gamer, Polygon y Rock Paper Shotgun, la Steam News API y subreddits, normalizados a una representacion comun con limites por fuente, timeout y control de errores por servicio.",
        },
        {
          number: "02",
          title: "Seleccion",
          description:
            "Filtros de calidad, emparejado de juegos con inclusiones y exclusiones, agrupacion de historias y un limite previo por juego que evita pagar inferencia por historias que se van a descartar.",
        },
        {
          number: "03",
          title: "Enriquecimiento y publicacion",
          description:
            "La IA resume, puntua y categoriza lo que sobrevive; el resultado se guarda en JSON atomico, se confirma en el repositorio y se despliega como web estatica.",
        },
      ],
    },
    closingLine: "Menos ruido. Mas juegos. Fresco cada hora.",
    ctaLabel: "Abrir Euromario",
    ctaUrl: "https://mariomunpeq.github.io/Euromario/",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseño y construccion completa del pipeline: recoleccion multi-fuente, normalizacion, emparejado de juegos, agrupacion de historias y politica de retencion.",
        "Diseño de un contrato de IA neutral entre proveedores con validacion estructurada de la salida y gestion de fallos: Ollama local con respaldo en Groq.",
        "Optimizacion de costes de inferencia aplicando el limite por juego antes y despues de la IA, con una reduccion de 64 a 13 llamadas en una ejecucion real.",
        "Frontend vanilla sin dependencias con filtros, estados visuales y sincronizacion de la URL.",
        "Automatizacion e implementacion: GitHub Actions ejecuta el pipeline cada hora, confirma los datos y despliega el frontend en GitHub Pages.",
        "Suite de pruebas pytest de 265 casos que cubren el nucleo del pipeline.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Emparejamiento robusto",
          detail:
            "Evitar falsos positivos de alias cortos como GTA usando limites de palabra y dando prioridad a la lista de exclusion sobre la de inclusion.",
        },
        {
          label: "Coste de la IA",
          detail:
            "Aplicar el tope por juego antes de la inferencia para no pagar llamadas que luego se descartan: de 64 a 13 en una ejecucion real.",
        },
        {
          label: "IA impredecible",
          detail:
            "Validar cada respuesta estructurada, reintentar salidas invalidas y cambiar de proveedor ante fallos de infraestructura sin romper el run completo.",
        },
        {
          label: "Web estatica viva",
          detail:
            "Conseguir un digest que se renueva cada hora sin backend: el repositorio es el almacen, GitHub Actions es el programador.",
        },
      ],
    },
  },
  {
    slug: "cosmere-archive",
    name: "Cosmere Archive",
    summary:
      "Archivo interactivo del Cosmere, el universo literario de Brandon Sanderson, pensado para explorar sus mundos, personajes, historias y sistemas a traves de una experiencia visual alejada del formato tradicional de una wiki.",
    description:
      "Un proyecto personal y fan de Brandon Sanderson que construye un archivo interactivo del Cosmere: en vez de listados estaticos, cada seccion es una experiencia visual. Hay un mapa galactico con mundos tridimensionales, sus esquirlas y las rutas de los trotamundos; una biblioteca con un lector 3D que extrae cada libro de su estanteria y pasa las paginas con animacion de vuelta; la escena 3D del Aharietiam con las hojas de los Heraldos; una cronologia cosmica con eras y eventos; un grafo de fuerzas (d3-force) para las relaciones entre personajes; un manuscrito de los sistemas de magia con la tabla alomantica; y un oceano interactivo en Canvas 2D que representa las almas de los personajes (Shadesmar). Desarrollado desde cero para practicar arquitectura frontend, modelado de datos, componentes reutilizables y despliegue continuo, con React, TypeScript, Vite y Tailwind, WebGL con Three.js, animaciones con GSAP y tests con Vitest.",
    tagline:
      "Exploracion interactiva del Cosmere · React · Three.js · d3-force · GSAP",
    version: "1.0.0",
    stack: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vite",
      "React Router",
      "Three.js",
      "React Three Fiber",
      "GSAP",
      "d3-force",
      "PWA",
      "GitHub Pages",
    ],
    links: {
      demo: "https://mariomunpeq.github.io/Cosmere-Archive/",
      github: "https://github.com/MarioMunPeq/Cosmere-Archive",
    },
    images: [
      {
        src: "/images/projects/cosmere-archive/main.webp",
        alt: "Vista principal del mapa galactico de Cosmere Archive",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/cosmere-archive/biblioteca.webp",
        alt: "Biblioteca virtual con los libros del archivo",
        caption: "Biblioteca",
      },
      {
        src: "/images/projects/cosmere-archive/libro personaje.webp",
        alt: "Archivo biografico de personajes",
        caption: "Personajes",
      },
      {
        src: "/images/projects/cosmere-archive/el diagrama.webp",
        alt: "Manuscrito Ars Arcanum de los sistemas de magia",
        caption: "Ars Arcanum",
      },
      {
        src: "/images/projects/cosmere-archive/aharietiam.webp",
        alt: "Escena 3D del Aharietiam con las hojas de los Heraldos",
        caption: "Aharietiam",
      },
      {
        src: "/images/projects/cosmere-archive/shadesmar.webp",
        alt: "Mapa mental del archivo",
        caption: "Mapa mental",
      },
    ],
    features: [
      {
        name: "Mapa galactico de mundos",
        description:
          "Un mapa del Cosmere con los mundos y sus esquirlas, que permite seleccionar cada planeta para consultar su ficha, sus sagas y las rutas de los trotamundos (worldhoppers).",
      },
      {
        name: "Lector de libros en 3D",
        description:
          "Una biblioteca virtual donde cada libro se extrae de la estanteria y abre en un lector 3D con paginas que se vuelven, tambien esquinas plegadas y texto seleccionable.",
      },
      {
        name: "Escena 3D del Aharietiam",
        description:
          "Una escena tridimensional ceremonial con las hojas de los Heraldos, generadas como mallas 3D a partir de las imagenes: seleccion e inspeccion de cada hoja, particulas, iluminacion y audio de interaccion propio.",
      },
      {
        name: "Cronologia cosmica",
        description:
          "Una linea temporal horizontal con eras, mas de un centenar de eventos, vidas de personajes y viajes de trotamundos, con tarjetas de detalle e interaccion por era.",
      },
      {
        name: "Relaciones entre personajes",
        description:
          "Grafo de fuerzas con d3-force que conecta a los personajes por sus relaciones, con filtros por planeta y paneles de detalle vinculados entre fichas.",
      },
      {
        name: "Ars Arcanum: sistemas de magia",
        description:
          "Un manuscrito por mundo con sus sistemas de magia, referencias cruzadas y la tabla alomantica expandible de los metales.",
      },
      {
        name: "Shadesmar: oceano de almas",
        description:
          "Una experiencia interactiva en Canvas 2D donde cada planeta es una constelacion de almas: observar, enfocar e inspeccionar a personajes mediante un motor de fisica propio.",
      },
      {
        name: "Visor y estadisticas",
        description:
          "Un mapa mental en Canvas, un comparador de personajes y una pagina de estadisticas con graficas SVG y contadores animados para recorrer los datos del archivo.",
      },
    ],
    conceptBlock: {
      title: "¿Por que una exploracion visual?",
      paragraphs: [
        "La idea de Cosmere Archive es presentar el mundo del Cosmere de Brandon Sanderson de forma visual e interactiva, alejandose del formato tradicional de una wiki donde prima el texto.",
        "En vez de listados, cada apartado se convierte en una experiencia de exploracion: un mapa galactico, un lector 3D, una cronologia, un grafo de relaciones o un oceano de almas. El objetivo es que consultar la informacion se sienta como recorrer un archivo, no como leer una enciclopedia.",
      ],
      highlights: [
        "Exploracion interactiva",
        "Mapa galactico 3D",
        "Lector de libros 3D",
        "Grafo de relaciones",
        "Canvas 2D y WebGL",
      ],
    },
    designSystem: {
      title: "Identidad",
      description:
        "Una estetica entre manuscrito y cosmo: paneles tipo pergamino para la informacion, temas por esquirlas con paletas propias, fondos estelares y animaciones cosmicas en Tailwind y GSAP.",
      points: [
        "Temas por esquirlas",
        "Paneles tipo pergamino",
        "Fondos estelares",
        "Animaciones con GSAP",
        "Componentes reutilizables",
        "Paleta cosmica y calida",
        "Responsive",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "Un frontend con paginas cargadas de forma perezosa (lazy), datos estaticos y generados, hooks propios para estado y metadatos SEO, y rutas con HashRouter para desplegar en GitHub Pages.",
      layers: [
        {
          number: "01",
          title: "Paginas y enrutado",
          description:
            "Cada seccion es una pagina cargada con lazy() y conectada con React Router mediante HashRouter, lo que permite enlaces directos y refrescos en GitHub Pages.",
        },
        {
          number: "02",
          title: "Datos",
          description:
            "Modelos estaticos en TypeScript y JSON: mundos, libros y sagas, eventos de la cronologia, sistemas de magia y registros de personajes generados.",
        },
        {
          number: "03",
          title: "Motores interactivos",
          description:
            "Escenas WebGL con Three.js y React Three Fiber (libros y Aharietiam), grafo de fuerzas con d3-force, y un motor Canvas 2D propio para Shadesmar con fisica y seleccion de entidades.",
        },
      ],
    },
    closingLine:
      "Un archivo que no solo guarda el Cosmere: te invita a recorrerlo.",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseno e implementacion completa del proyecto desde cero como facu de desarrollo web moderno con React, TypeScript, Vite y Tailwind.",
        "Creacion de escenas 3D con Three.js y React Three Fiber (biblioteca y Aharietiam) con animaciones de extraccion y paso de pagina.",
        "Modelado de datos estaticos y generados: mundos, libros, sagas, eventos, sistemas de magia y personajes.",
        "Desarrollo de un grafo de fuerzas con d3-force para las relaciones entre personajes.",
        "Construccion de un motor Canvas 2D propio para la experiencia de Shadesmar con fisica, seleccion y constelaciones.",
        "Despliegue continuo con GitHub Actions en GitHub Pages y configuracion PWA con service worker.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Hibrido HTML + WebGL",
          detail:
            "Mantener el texto seleccionable y accesible dentro de un lector 3D: el contenido se proyecta como overlay HTML sobre la geometria Three.js, no como textura.",
        },
        {
          label: "Paso de pagina 3D",
          detail:
            "Animar la curvatura de cada pagina con geometria BufferGeometry deformada por frame, conservando el rendimiento y el acabado de papel.",
        },
        {
          label: "Motor Canvas propio",
          detail:
            "Implementar la interaccion de Shadesmar (observar, enfocar, inspeccionar) con un sistema de fisica y seleccion propio sobre Canvas 2D, sin librerias extra.",
        },
        {
          label: "Enrutado y despliegue",
          detail:
            "Hacer que el cliente-routing funcione en GitHub Pages recurriendo a HashRouter, con prefijo BASE_URL en las rutas de los assets.",
        },
      ],
    },
  },
  {
    slug: "recomendador-campeones",
    name: "Recomendador de Campeones",
    summary:
      "Proyecto final del bootcamp de Qualentum: un modelo de machine learning en Python que recomienda campeones de League of Legends entrenado con datos reales de partidas obtenidos de la API de Riot Games.",
    description:
      "Un recomendador de campeones para League of Legends desarrollado como proyecto final del bootcamp de Qualentum. El proyecto obtiene datos reales de partidas a traves de la API de Riot Games (PUUID, historial y detalle de las partidas de un jugador), construye un dataset con las caracteristicas de cada partida (kills, deaths, assists, KDA ratio, rol, partidas jugadas y tasa de victoria) y entrena un clasificador Random Forest para estimar la probabilidad de cada campeon candidato. La funcion recommend_champions filtra los campeones ya jugados y por rol, y devuelve el Top-N de campeones con mayor probabilidad de ser elegidos. Todo el flujo esta documentado en notebooks de Jupyter con graficas de analisis exploratorio y de evaluacion del modelo.",
    tagline:
      "Proyecto Bootcamp Qualentum · Machine Learning · Riot Games API · Python",
    version: "1.0.0",
    stack: [
      "Python",
      "Jupyter Notebook",
      "pandas",
      "NumPy",
      "scikit-learn",
      "imblearn",
      "matplotlib",
      "seaborn",
      "Riot Games API",
      "requests",
    ],
    links: { demo: null, github: null },
    images: [
      {
        src: "/images/projects/recomendador-campeones/main.png",
        alt: "Grafica de la relacion entre el KDA ratio y la tasa de victoria",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/recomendador-campeones/main.png",
        alt: "Relacion entre el KDA ratio y la tasa de victoria por campeon",
        caption: "KDA y tasa de victoria",
      },
      {
        src: "/images/projects/recomendador-campeones/eda-distribuciones.png",
        alt: "Distribucion de kills, deaths y assists en las partidas",
        caption: "Distribucion de estadisticas",
      },
      {
        src: "/images/projects/recomendador-campeones/frecuencia-campeones.png",
        alt: "Frecuencia de campeones jugados en el historial",
        caption: "Campeones mas jugados",
      },
      {
        src: "/images/projects/recomendador-campeones/frecuencia-roles.png",
        alt: "Frecuencia de roles jugados",
        caption: "Roles jugados",
      },
      {
        src: "/images/projects/recomendador-campeones/kda-ratio.png",
        alt: "Distribucion del KDA ratio en las partidas",
        caption: "Distribucion del KDA ratio",
      },
      {
        src: "/images/projects/recomendador-campeones/confusion-matrix.png",
        alt: "Matriz de confusion de la prediccion del modelo",
        caption: "Matriz de confusion",
      },
    ],
    features: [
      {
        name: "Datos reales de partidas",
        description:
          "Obtiene el PUUID del invocador, su historial de partidas y el detalle de cada una mediante la API de Riot Games con la libreria requests, partiendo de datos reales y no sinteticos.",
      },
      {
        name: "Caracteristicas del jugador",
        description:
          "Construye el dataset con kills, deaths, assists, KDA ratio, rol, partidas jugadas y tasa de victoria por campeon, convirtiendo el rol categorico a numerico con get_dummies.",
      },
      {
        name: "Campeones candidatos por rol",
        description:
          "Filtra los campeones todavia no jugados y los del rol indicado usando la etiqueta de rol de cada campeon de champions.json antes de ordenar por probabilidad.",
      },
      {
        name: "Aprendizaje con arboles aleatorios",
        description:
          "Entrena un clasificador Random Forest cuyos hiperparametros se ajustan con GridSearchCV y validacion cruzada de 5 pliegues.",
      },
      {
        name: "Balanceo de clases con SMOTE",
        description:
          "Aplica SMOTE para equilibrar las clases desbalanceadas del conjunto de entrenamiento, evitando sesgos hacia los campeones mas frecuentes.",
      },
      {
        name: "Evaluacion completa del modelo",
        description:
          "Mide accuracy, precision, recall, F1, matriz de confusion, curvas ROC (AUC) y log loss, e interpreta las curvas precision-recall y la importancia de las caracteristicas.",
      },
      {
        name: "Recomendacion Top-N",
        description:
          "La funcion recommend_champions(kills, deaths, assists, role, top_n) usa predict_proba y devuelve los N campeones con mayor probabilidad.",
      },
      {
        name: "Feedback interactivo",
        description:
          "Permite valorar las recomendaciones con ipywidgets (botones de me gusta) y guardar el feedback del usuario en user_feedback.json.",
      },
    ],
    conceptBlock: {
      title: "¿Por que un clasificador de probabilidad?",
      paragraphs: [
        "El proyecto es mi trabajo final del bootcamp de Qualentum y busca poner en practica un flujo completo de ciencia de datos: obtencion de datos reales, limpieza, analisis exploratorio, entrenamiento y evaluacion de un modelo.",
        "Elegi un clasificador Random Forest con predict_proba porque queremos ordenar a todos los campeones candidatos por su probabilidad relativa y quedarnos con el Top-N, en vez de predecir una unica clase. Combinarlo con GridSearchCV y SMOTE me permitio explorar el ajuste de hiperparametros y enfrentar el desbalanceo de clases propio de un historial real de partidas.",
      ],
      highlights: [
        "Datos reales de Riot Games",
        "Random Forest",
        "GridSearchCV + cross-validation",
        "SMOTE para clases desbalanceadas",
        "Recomendacion Top-N por probabilidad",
      ],
    },
    designSystem: {
      title: "Visualizacion",
      description:
        "Un flujo de trabajo documentado en notebooks de Jupyter, donde el analisis exploratorio y la evaluacion del modelo se apoyan en graficas de matplotlib y seaborn.",
      points: [
        "Jupyter Notebook",
        "Analisis exploratorio (EDA)",
        "Histogramas y boxplots",
        "Matrices de correlacion",
        "Curvas ROC y precision-recall",
        "Matriz de confusion",
        "Importancia de caracteristicas",
      ],
    },
    architecture: {
      title: "Flujo del proyecto",
      description:
        "Un pipeline de ciencia de datos que va desde la extraccion de partidas reales hasta la recomendacion final de campeones.",
      layers: [
        {
          number: "01",
          title: "Obtencion de datos",
          description:
            "La API de Riot Games proporciona el PUUID del invocador a partir de su Riot ID y, con el, el historial de partidas y el detalle de cada una.",
        },
        {
          number: "02",
          title: "Preparacion del dataset",
          description:
            "Se construye la tabla de partidas con kills, deaths, assists, KDA ratio, rol, partidas jugadas y tasa de victoria, y se cruza con champions.json para conocer el rol de cada campeon.",
        },
        {
          number: "03",
          title: "Entrenamiento y evaluacion",
          description:
            "Se aplican GridSearchCV con cross-validation y SMOTE al Random Forest, y el modelo se evalua con accuracy, precision, recall, F1, ROC-AUC, log loss y la matriz de confusion.",
        },
        {
          number: "04",
          title: "Recomendacion",
          description:
            "recommend_champions filtra los campeones sin jugar y del rol pedido, ordena por probabilidad de predict_proba y devuelve el Top-N solicitado.",
        },
      ],
    },
    closingLine:
      "Datos reales de partidas que se convierten en sugerencias de campeones con las que seguir mejorando tu partida.",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseno e implementacion completa del pipeline de ciencia de datos como proyecto final del bootcamp de Qualentum.",
        "Integracion con la API de Riot Games para obtener datos reales de partidas de un invocador (PUUID, historial y detalle).",
        "Construccion y limpieza del dataset con pandas y NumPy, incluyendo la conversion del rol categorico a numerico.",
        "Entrenamiento de un Random Forest con GridSearchCV, validacion cruzada y SMOTE para balancear las clases.",
        "Evaluacion del modelo con metricas de clasificacion (accuracy, F1, ROC-AUC, log loss) y elaboracion de graficas de EDA con matplotlib y seaborn.",
        "Desarrollo de la funcion recomendadora Top-N y del mecanismo de feedback interactivo con ipywidgets.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Limites de la API",
          detail:
            "La clave de Riot Games expira cada dia y las peticiones tienen limites de tasa, lo que obligo a estructurar la recogida de partidas por lotes y a manejar errores de la API.",
        },
        {
          label: "Datos desbalanceados",
          detail:
            "Algunos campeones se jugaban mucho mas que otros, asi que hubo que aplicar SMOTE para equilibrar las clases antes del entrenamiento.",
        },
        {
          label: "Recomendacion multiclase",
          detail:
            "Como queremos ordenar campeones por probabilidad en vez de predecir una clase, use predict_proba en lugar de un clasificador binario tradicional.",
        },
        {
          label: "Filtrado de candidatos",
          detail:
            "Habia que descartar los campeones ya jugados y los que no correspondian al rol pedido antes de calcular el Top-N, para que las sugerencias fueran utiles y novedosas.",
        },
      ],
    },
  },
  {
    slug: "proyecto-gambia",
    name: "Proyecto Gambia",
    summary:
      "Aplicacion Android nativa en Kotlin para la gestion de salud en Gambia, inspirada en MyGNUHealth e implementada como mi Trabajo de Fin de Grado de DAM, con datos medicos offline y sincronizacion a un servidor remoto.",
    description:
      "Una aplicacion nativa de Android en Kotlin que reproduce la filosofia de MyGNUHealth para acompanar la gestion de la salud en Gambia. La aplicacion registra datos medicos del paciente (peso, presion sanguinea, glucosa, saturacion de oxigeno, sueno, actividad fisica, actividades sociales, valor energetico y estado), de manera manual o mediante medicion directa con dispositivos Bluetooth de bajo consumo, los almacena de forma local en una base de datos SQLite y permite sincronizarlos contra un servidor remoto con autenticacion. El proyecto, desarrollado como mi Trabajo de Fin de Grado de Desarrollo de Aplicaciones Multiplataforma, sigue una arquitectura de actividad unica con fragments y paquetes por funcionalidad, y se apoya en la navegacion del Jetpack para conectar las distintas pantallas.",
    tagline:
      "TFG de DAM · Android nativo · Kotlin · MyGNUHealth · Offline-first",
    version: "1.0.0",
    stack: [
      "Kotlin",
      "Android",
      "Jetpack",
      "Navigation",
      "SQLite",
      "Retrofit",
      "Gson",
      "OkHttp",
      "MPAndroidChart",
      "Bluetooth LE",
      "Gradle",
      "jBCrypt",
    ],
    links: { demo: null, github: null },
    images: [
      {
        src: "/images/projects/proyecto-gambia/main.png",
        alt: "Logo de Proyecto Gambia",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/proyecto-gambia/main.png",
        alt: "logo",
        caption: "logo",
      },
      {
        src: "/images/projects/proyecto-gambia/registro.png",
        alt: "Pantalla de registro de nuevo usuario",
        caption: "Registro",
      },
      {
        src: "/images/projects/proyecto-gambia/datos.png",
        alt: "Pantalla de introduccion manual de datos medicos",
        caption: "Datos manuales",
      },
      {
        src: "/images/projects/proyecto-gambia/servidor.png",
        alt: "Opciones del servidor, sincronizacion y libro de vida",
        caption: "Servidor",
      },
      {
        src: "/images/projects/proyecto-gambia/libro-vida.png",
        alt: "Pantalla del libro de vida del paciente",
        caption: "Libro de vida",
      },
      {
        src: "/images/projects/proyecto-gambia/perfil.png",
        alt: "Pantalla de perfil para modificar datos de usuario",
        caption: "Perfil",
      },
      {
        src: "/images/projects/proyecto-gambia/conexion.png",
        alt: "Ajustes de conexion con el servidor",
        caption: "Conexion",
      },
      {
        src: "/images/projects/proyecto-gambia/bluetooth.png",
        alt: "Conexion Bluetooth con tensiometro y termometro",
        caption: "Dispositivos Bluetooth",
      },
    ],
    features: [
      {
        name: "Registro de datos medicos",
        description:
          "Permite introducir de manera manual los datos de salud del paciente: peso, presion sanguinea, glucosa, saturacion de oxigeno, sueno, actividad fisica, actividades sociales, valor energetico y estado.",
      },
      {
        name: "Graficas interactivas",
        description:
          "Visualiza de forma grafica los datos del usuario activo mediante graficas de linea y de barras construidas con la libreria MPAndroidChart, con textos de inicio y fin de datos.",
      },
      {
        name: "Dispositivos Bluetooth de baja energia",
        description:
          "Lee la medicion en directo de un tensiometro y de un termometro conectados por Bluetooth LE, suscribiendose a las notificaciones de la caracteristica de medida medica (servicio 0x1810).",
      },
      {
        name: "Almacenamiento offline",
        description:
          "Guarda todos los registros en una base de datos SQLite local (con hash BCrypt para las credenciales) de forma que la aplicacion funciona sin conexion.",
      },
      {
        name: "Sincronizacion con servidor",
        description:
          "Sube las Pols pendientes al servidor remoto mediante Retrofit y OkHttp en una corrutina, controla la disponibilidad de red y notifica al usuario del resultado.",
      },
      {
        name: "Libro de vida",
        description:
          "Accede al libro de vida del paciente desde las opciones del servidor, integrado con el flujo de sincronizacion de los datos locales.",
      },
      {
        name: "Permisos segun la version",
        description:
          "Solicita los permisos de Bluetooth, localizacion e internet de forma adaptada a la version de Android (target 31), distinguiendo entre API anterior y posterior.",
      },
      {
        name: "Control de bloqueo de pantalla",
        description:
          "Gestiona el hilo de subida de datos para evitar errores al abandonar la aplicacion (onPause) mientras se sincroniza la informacion.",
      },
    ],
    conceptBlock: {
      title: "¿Por que una aplicacion Android nativa en Kotlin?",
      paragraphs: [
        "El proyecto es mi Trabajo de Fin de Grado de DAM y busca llevar la filosofia de GNU Health / MyGNUHealth a un acompanante movil para la gestion de salud en Gambia.",
        "Elegi Android nativo con Kotlin y arquitectura de actividad unica con fragments para mantener el codigo organizado por funcionalidades, y priorice el almacenamiento local offline con sincronizacion opcional, pensando en un escenario real donde la conectividad no siempre esta garantizada.",
      ],
      highlights: [
        "Android nativo",
        "Kotlin",
        "SQLite offline",
        "Sincronizacion remota",
        "Bluetooth Low Energy",
      ],
    },
    designSystem: {
      title: "Interfaz",
      description:
        "Una interfaz de Material Design basada en fragments, con navegacion guiada por el componente Navigation del Jetpack y paquetes por funcionalidad.",
      points: [
        "Material Design",
        "Actividad unica + fragments",
        "Navigation Component",
        "Paquetes por feature",
        "ViewModels por pantalla",
        "TextInputLayouts",
        "Orientacion portrait",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "Una sola actividad con fragments conectados mediante el grafo de navegacion y paquetes organizados por funcionalidad.",
      layers: [
        {
          number: "01",
          title: "Capa de datos",
          description:
            "Base de datos SQLite con SQLiteOpenHelper propio (tablas de personas, instituciones, datos de salud y pols) mas cliente Retrofit con Gson y OkHttp para el servidor remoto.",
        },
        {
          number: "02",
          title: "Navegacion",
          description:
            "Un unico grafo de navegacion (main_graph) que conecta los fragments, arrancando por el menu principal y con acciones generadas automaticamente.",
        },
        {
          number: "03",
          title: "Vistas y ViewModels",
          description:
            "Fragments por pantalla, cada uno con su ViewModel, que mantienen la separacion entre la interfaz grafica y la logica de negocio.",
        },
      ],
    },
    closingLine:
      "Salud que se registra en el movil, se consulta en graficas y se sincroniza para acompañar a quien la necesita.",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseno e implementacion completa de la aplicacion Android nativa en Kotlin como Trabajo de Fin de Grado.",
        "Modelado de la base de datos SQLite con tablas de personas, instituciones, datos de salud y pols, y hash de credenciales con BCrypt.",
        "Integracion de graficas interactivas con MPAndroidChart para la visualizacion de los datos medicos.",
        "Comunicacion Bluetooth Low Energy con tensiometro y termometro para lectura directa de mediciones.",
        "Sincronizacion de datos con el servidor remoto mediante Retrofit, Gson y OkHttp, con control de disponibilidad de red.",
        "Pruebas unitarias sobre las operaciones mas criticas de la base de datos y de la subida de datos.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Arquitectura por fragments",
          detail:
            "Mantener una arquitectura de actividad unica con fragments y paquetes por funcionalidad, conectados mediante el grafo de navegacion.",
        },
        {
          label: "Bluetooth Low Energy",
          detail:
            "Leer la caracteristica medica de un tensiometro y un termometro (servicio 0x1810) suscribiendose a sus notificaciones y ordenando manualmente los datos recibidos.",
        },
        {
          label: "Sincronizacion remota",
          detail:
            "Subir las pols al servidor en una corrutina para no bloquear la interfaz, gestionando errores, conexion y el ciclo de vida de la actividad.",
        },
        {
          label: "Orden de los datos Bluetooth",
          detail:
            "No se conocia el orden en que se enviaban los datos de medicion, asi que hubo que ordenarlos manualmente y conservar el mas reciente.",
        },
      ],
    },
  },
  {
    slug: "repository-library",
    name: "Repository Library",
    summary:
      "Un hub con la distribucion del cliente de escritorio de Steam que reune varios portfolios tematicos de videojuegos y los abre como si fueran productos de una tienda.",
    description:
      "Un hub que reproduce la distribucion del cliente de escritorio de Steam —no la de su version web— para reunir y dar acceso a distintos portfolios personales tematicos. La interfaz replica el shell del cliente real: la barra de menus superior de 26px, la barra de navegacion principal de 50px con las pestanas TIENDA / BIBLIOTECA / COMUNIDAD, la sidebar fija de 340px con la lista de proyectos y su buscador, el area de contenido principal y la barra inferior que abre el panel de amigos como overlay. Cada proyecto se presenta como una pagina de tienda completa, con banner, boton JUGAR, fila de estadisticas, pestanas, capturas y feed de actividad. Los datos estan tipados en un unico archivo, de modo que anadir un portfolio nuevo es escribir un objeto, no tocar la interfaz. Todos los iconos son SVG en linea, sin librerias externas.",
    tagline: "Hub de portfolios · Estetica Steam · React 19 · Vite 8",
    version: "1.0.0",
    stack: ["TypeScript", "React", "Vite", "HTML/CSS", "GitHub Pages"],
    links: {
      demo: "https://mariomunpeq.github.io/Repository-Library/",
      github: "https://github.com/MarioMunPeq/Repository-Library",
    },
    images: [
      {
        src: "/images/projects/repository-library/1.png",
        alt: "Pantalla de inicio de Repository Library con la biblioteca de portfolios",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/repository-library/Inicio.png",
        alt: "Biblioteca de portfolios en Repository Library",
        caption: "Biblioteca",
      },
      {
        src: "/images/projects/repository-library/Tienda.png",
        alt: "Pagina de tienda de un proyecto en Repository Library",
        caption: "Tienda",
      },
      {
        src: "/images/projects/repository-library/Detalles%20Juego.png",
        alt: "Vista de detalles de un juego en Repository Library",
        caption: "Detalles del juego",
      },
      {
        src: "/images/projects/repository-library/Perfil.png",
        alt: "Perfil de usuario en Repository Library",
        caption: "Perfil",
      },
    ],
    features: [
      {
        name: "Shell calcado del cliente de escritorio",
        description:
          "Barra de menus de 26px, barra de navegacion de 50px con controles de ventana reales, sidebar fija de 340px y barra inferior de 40px, con las medidas exactas del cliente de Steam.",
      },
      {
        name: "Pagina de tienda por proyecto",
        description:
          "El componente ProjectStorePage monta en el area de contenido el banner, el boton JUGAR, la fila de estadisticas, las pestanas, las capturas y la actividad, construido por separado del shell.",
      },
      {
        name: "Panel de amigos como overlay",
        description:
          "El boton de la barra inferior abre y cierra un FriendsPanel fijo en la esquina inferior derecha, superpuesto al contenido sin desmontar la pagina.",
      },
      {
        name: "Buscador con filtro",
        description:
          "La sidebar incluye un buscador con lupa que filtra la lista de proyectos en vivo, manteniendo la seleccion y el estado de la fila activa.",
      },
      {
        name: "Datos tipados y extensibles",
        description:
          "Los proyectos viven en un unico archivo tipado: anadir un portfolio nuevo es escribir un objeto nuevo, sin modificar componentes.",
      },
      {
        name: "Iconografia SVG en linea",
        description:
          "Todos los iconos de la interfaz estan dibujados como SVG en linea, sin ninguna libreria de iconos externa.",
      },
    ],
    conceptBlock: {
      title: "¿Por que replicar el cliente de escritorio?",
      paragraphs: [
        "La version web de Steam esta pensada para el navegador. Esta replica la de escritorio, con sus barras de 26 y 50 pixeles, su sidebar fija y su barra inferior, porque es la distribucion que la gente asocia con una biblioteca de juegos.",
        "Adoptar esa distribucion convierte la pagina en algo reconocible sin explicar nada: cada proyecto se lee como un producto, con su banner, su boton de jugar y sus estadisticas. El trabajo entonces no esta en inventar una interfaz, sino en construir las piezas de la interfaz correcta y mantenerlas fielmente medidas.",
      ],
      highlights: [
        "Distribucion de escritorio",
        "Medidas exactas",
        "Datos tipados",
        "SVG en linea",
      ],
    },
    designSystem: {
      title: "Sistema visual",
      description:
        "Tokens de color, medidas del shell y estados de hover replicados del cliente original, con tipografia sans-serif en toda la interfaz.",
      points: [
        "Tipografia Motiva Sans con fallback a Arial",
        "Barras de 26px, 50px y 40px",
        "Sidebar fija de 340px",
        "Hover de controles #2a3f52",
        "Fila seleccionada #3E4F69",
        "Borde inferior azul en la pestana activa",
        "Cerrar de ventana en #e81123",
        "Iconos SVG en linea",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "Un shell fijo que compone el area de contenido con la pagina de tienda del proyecto seleccionado, y un archivo de datos tipado como unica fuente.",
      layers: [
        {
          number: "01",
          title: "Shell de la interfaz",
          description:
            "MenuBar, NavBar, Sidebar, Footer y el contenedor del area de contenido, con las medidas y los estados de hover del cliente original.",
        },
        {
          number: "02",
          title: "Pagina de tienda",
          description:
            "ProjectStorePage y sus piezas (ProjectHeader, ProjectStats, ProjectTabs, ScreenshotsRow, ActivityFeed) montan el proyecto activo en el area de contenido.",
        },
        {
          number: "03",
          title: "Capa de datos",
          description:
            "projects.tsx con los portfolios tipados como fuente unica, ampliable escribiendo un objeto nuevo en lugar de editar componentes.",
        },
      ],
    },
    closingLine:
      "Una biblioteca que se abre como un cliente de escritorio, con un producto por proyecto.",
    ctaLabel: "Abrir Repository Library",
    ctaUrl: "https://mariomunpeq.github.io/Repository-Library/",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseno e implementacion completa del shell replicando las medidas y los estados del cliente de escritorio de Steam.",
        "Construccion del componente ProjectStorePage y de sus piezas: banner, boton JUGAR, estadisticas, pestanas, capturas y actividad.",
        "Panel de amigos como overlay fijo, abierto y cerrado desde la barra inferior.",
        "Buscador con filtro en la sidebar, con estado de seleccion sincronizado con el contenido.",
        "Modelado de los datos de proyectos en TypeScript y del set de iconos SVG en linea.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Fidelidad de las medidas",
          detail:
            "Cada barra, la sidebar y el area de contenido tienen medidas concretas del cliente original, y cualquier desvio se nota en pantalla.",
        },
        {
          label: "Overlay sin desmontar",
          detail:
            "El panel de amigos se superpone en la esquina inferior derecha sin romper el scroll ni el estado del contenido que hay debajo.",
        },
        {
          label: "Sin librerias de iconos",
          detail:
            "Replicar los iconos del cliente con SVG en linea en lugar de tirar de una libreria externa, manteniendolos legibles a 16 y 24 pixeles.",
        },
      ],
    },
  },
  {
    slug: "vault-archive",
    name: "Vault Archive",
    summary:
      "Un portfolio construido dentro de un Pip-Boy 3000 replicado carcasa por carcasa, con seis modulos que funcionan en lugar de un filtro verde sobre una pagina web.",
    description:
      "Un portfolio que no es una web con un filtro verde, sino un Pip-Boy 3000: hay carcasa, chapa, tornillos, dial, rejilla, un tubo de rayos catodicos con su mascara y una secuencia de arranque. Dentro funcionan seis modulos reales. STAT es la hoja de personaje, con S.P.E.C.I.A.L. interactivo, perks y estado de condiciones. MISIONES es un diario al estilo F3 con lista a la izquierda, detalle a la derecha y objetivos con checklist, enlazado a repos y demos. DATA es la terminal de la boveda, con identidad, formacion, experiencia y contacto, con efecto de maquina de escribir. MAP es un mapa de Valladolid en Mapbox GL con un estilo propio monocromo verde, los sitios donde he estudiado y trabajado, indicadores de lo que queda fuera de pantalla y lecturas de coordenadas. RADIO es una radio con dial, espectro de barras y dos emisoras con musica real que sigue sonando al cambiar de modulo. HACK es el minijuego Termlink, donde se eligen palabras del volcado de memoria y los bloqueos determinan los intentos. Los modulos se cambian con las teclas 1 a 6, con las flechas de la barra de modulos o con el boton de encendido de la carcasa, que apaga y enciende el tubo de verdad, y el estado del operador —HP, NIVEL, AP— permanece visible abajo.",
    tagline: "Portfolio Pip-Boy 3000 · Seis modulos · Fallout 3",
    version: "1.0.0",
    stack: ["TypeScript", "React", "Vite", "Mapbox GL", "HTML/CSS"],
    links: {
      demo: "https://mariomunpeq.github.io/Vault-Archive/",
      github: "https://github.com/MarioMunPeq/Vault-Archive",
    },
    images: [
      {
        src: "/images/projects/vault-archive/1.png",
        alt: "Vault Archive con el Pip-Boy 3000 y la barra de modulos",
      },
    ],
    screenshots: [
      {
        src: "/images/projects/vault-archive/data.png",
        alt: "Modulo DATA con los registros personales del operador",
        caption: "Modulo DATA",
      },
      {
        src: "/images/projects/vault-archive/mapa.png",
        alt: "Mapa interactivo de Valladolid en el modulo MAP",
        caption: "Modulo MAP",
      },
      {
        src: "/images/projects/vault-archive/misiones.png",
        alt: "Diario de misiones del Pip-Boy",
        caption: "Modulo MISIONES",
      },
      {
        src: "/images/projects/vault-archive/radio.png",
        alt: "Radio del Pip-Boy con sintonizador y espectro de audio",
        caption: "Modulo RADIO",
      },
    ],
    features: [
      {
        name: "Modulo STAT",
        description:
          "Hoja de personaje con S.P.E.C.I.A.L. interactivo —clic en un stat para ver su lectura—, perks y estado de condiciones.",
      },
      {
        name: "Modulo MISIONES",
        description:
          "Diario al estilo F3: lista a la izquierda, detalle a la derecha, objetivos con checklist y enlaces al repositorio y a la demo de cada proyecto.",
      },
      {
        name: "Modulo DATA",
        description:
          "Terminal de la boveda con los registros de identidad, formacion, experiencia y contacto, con efecto de maquina de escribir.",
      },
      {
        name: "Modulo MAP",
        description:
          "Mapa de Valladolid sobre Mapbox GL con estilo propio monocromo verde, los sitios donde he estudiado y trabajado, indicadores de lo que queda fuera de pantalla y lecturas de coordenadas.",
      },
      {
        name: "Modulo RADIO",
        description:
          "Radio con dial, espectro de barras y medidor de senal, con dos emisoras de musica real que siguen sonando al cambiar de modulo.",
      },
      {
        name: "Modulo HACK",
        description:
          "Minijuego Termlink: se eligen palabras del volcado de memoria y los bloqueos de codigo determinan si una palabra se borra o se consumen intentos.",
      },
      {
        name: "Carcasa y encendido reales",
        description:
          "La carcasa esta construida con chapa, tornillos, dial, rejilla y botones; el boton de encendido apaga y enciende el tubo de verdad.",
      },
      {
        name: "Secuencia de arranque",
        description:
          "Arranque con sprite y log POST, con las teclas 1 a 6 y las flechas de la barra de modulos como metodos de navegacion.",
      },
    ],
    conceptBlock: {
      title: "¿Por que un Pip-Boy y no un filtro verde?",
      paragraphs: [
        "Un filtro verde sobre una pagina web es un disfraz: la estructura de debajo sigue siendo una pagina web. Aqui la estructura de debajo es la de un Pip-Boy 3000, y los seis modulos que contiene funcionan de verdad.",
        "La consecuencia practica es que el dispositivo no es decoracion, es la interfaz. La carcasa decide donde caben los modulos, el tubo de rayos catodicos impone el fosforo, el dial y la rejilla ocupan el sitio que ocupan en el aparato, y el estado del operador es siempre visible porque en el aparato tambien lo es. La estetica no se aplica encima de la aplicacion: la aplicacion se construye dentro del aparato.",
      ],
      highlights: [
        "Dispositivo como interfaz",
        "Seis modulos funcionales",
        "Fosforo monocromo",
        "Navegacion por teclado",
      ],
    },
    designSystem: {
      title: "Interfaz",
      description:
        "Fosforo verde sobre negro en toda la interfaz, con el tubo de rayos catodicos como contenedor de todo el contenido y la carcasa como marco.",
      points: [
        "Fondo #070b05 con texto #9ece6a",
        "Envoltorio del tubo CRT con mascara y scanlines",
        "Carcasa de chapa con tornillos, dial y rejilla",
        "Barra de modulos y subpestanas",
        "Barra persistente de HP / NIVEL / AP",
        "Secuencia de arranque con sprite y log",
        "Efecto de maquina de escribir en DATA",
      ],
    },
    architecture: {
      title: "Arquitectura",
      description:
        "El dispositivo se compone por partes (carcasa, tubo, barra de estado, barra de modulos) y dentro del tubo cada modulo es una pestana independiente con su propio estado.",
      layers: [
        {
          number: "01",
          title: "Dispositivo",
          description:
            "Device/, con la carcasa fisica —chapa, tornillos, dial, rejilla y botones—, y Screen/, con el envoltorio del tubo de rayos catodicos que aloja el modulo activo.",
        },
        {
          number: "02",
          title: "Navegacion",
          description:
            "TabNav/ con la barra de modulos y las subpestanas, navegable con las teclas 1 a 6 y con las flechas, y StatusBar/ con el estado del operador siempre visible.",
        },
        {
          number: "03",
          title: "Modulos",
          description:
            "Un directorio por modulo, cada uno con su contenido y su estado propio: STAT, MISIONES, DATA, MAP, RADIO y HACK.",
        },
        {
          number: "04",
          title: "Arranque",
          description:
            "BootSequence/ con la secuencia de arranque, el sprite y el log POST, previa a la entrada en cualquier modulo.",
        },
      ],
    },
    closingLine:
      "Seis modulos, una carcasa y un tubo de rayos catodicos: el portfolio es el dispositivo, no la pagina que lo contiene.",
    ctaLabel: "Abrir Vault Archive",
    ctaUrl: "https://mariomunpeq.github.io/Vault-Archive/",
    role: {
      title: "Mi rol / Aportacion",
      items: [
        "Diseno e implementacion completa del portfolio dentro del Pip-Boy 3000, desde la carcasa hasta el tubo de rayos catodicos.",
        "Desarrollo de los seis modulos: STAT, MISIONES, DATA, MAP, RADIO y HACK, cada uno con su propio estado y su navegacion por teclado.",
        "Estilo de mapa propio en Mapbox Studio monocromo verde para que el mapa encaje con el fosforo de la interfaz, con sus capas y grosores ajustados.",
        "Indicadores de los puntos que quedan fuera de pantalla y lecturas de coordenadas en el modulo MAP, con degradacion limpia cuando faltan las variables de entorno.",
        "Radio con dial, espectro de barras y dos emisoras de musica real que persisten al cambiar de modulo.",
        "Secuencia de arranque con sprite y log, y barra de estado persistente de HP, NIVEL y AP.",
      ],
    },
    challenges: {
      title: "Retos tecnicos",
      items: [
        {
          label: "Que el mapa pertenezca al dispositivo",
          detail:
            "Hacer que un mapa de Mapbox GL se lea como parte del fosforo: estilo monocromo verde definido capa por capa en Mapbox Studio, en lugar de un mapa de colores encima de la interfaz.",
        },
        {
          label: "El mapa sin credenciales",
          detail:
            "Sin token ni estilo el modulo MAP no puede romperse: degrada a un mensaje de senal GPS no disponible en lugar de dejar la pantalla en blanco.",
        },
        {
          label: "Radio persistente",
          detail:
            "Que la musica siga sonando al cambiar de modulo exige sacar el estado del reproductor fuera del arbol del modulo, para que desmontarlo no lo corte.",
        },
        {
          label: "Termlink con reglas propias",
          detail:
            "El minijuego HACK tiene que interpretar los bloqueos del volcado de memoria —borrar una palabra o devolver intentos— y que el resultado se sienta coherente en cada ronda.",
        },
        {
          label: "Atraccion de la atencion",
          detail:
            "Los terminos de uso de Mapbox obligan a mostrar logotipo y atribucion, que hay que recolorear al fosforo y reagrupar en la esquina para que no choquen con el panel de ubicacion.",
        },
      ],
    },
  },
];
