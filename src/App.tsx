import { lazy, Suspense } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { TransitionRoutes } from "./components/transition/TransitionRoutes";
import { VideoTransition } from "./components/transition/VideoTransition";
import { FadeTransition } from "./components/transition/FadeTransition";
import { Layout } from "./components/layout/Layout";
import { ScrollProvider } from "./components/layout/ScrollProvider";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";
import { Experience } from "./pages/Experience";
import { NotFound } from "./pages/NotFound";
import { RouteMetadata } from "./components/seo/RouteMetadata";

/** Rutas cargadas de forma perezosa para reducir el bundle inicial. */
const Education = lazy(() =>
  import("./pages/Education").then((m) => ({ default: m.Education })),
);
const ProjectDetail = lazy(() =>
  import("./pages/ProjectDetail").then((m) => ({ default: m.ProjectDetail })),
);

/** Fallback de rutas perezosas. No interfiere con las transiciones de ruta:
 * el overlay de video / fundido cubre la pantalla durante el cambio, por lo
 * que el fallback solo es visible brevemente en navegaciones sin video
 * (movil o vuelos al home). */
function LazyFallback() {
  return <div className="min-h-dvh" />;
}

/**
 * La app se sirve bajo `/` (dominio personalizado mariomunpeq.is-a.dev).
 * En preview local tambien se sirve bajo `/`.
 */
const APP_BASE = "/";

function App() {
  return (
    <BrowserRouter basename={APP_BASE}>
      <RouteMetadata />
      <ScrollProvider>
        <Layout>
          <TransitionRoutes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/experience" element={<Experience />} />
            <Route
              path="/education"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <Education />
                </Suspense>
              }
            />
            <Route
              path="/proyectos/:slug"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <ProjectDetail />
                </Suspense>
              }
            />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </TransitionRoutes>
        </Layout>
        <VideoTransition />
        <FadeTransition />
      </ScrollProvider>
    </BrowserRouter>
  );
}

export default App;
