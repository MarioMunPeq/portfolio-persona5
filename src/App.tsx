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
import { Education } from "./pages/Education";
import { ProjectDetail } from "./pages/ProjectDetail";
import { NotFound } from "./pages/NotFound";
import { RouteMetadata } from "./components/seo/RouteMetadata";

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
            <Route path="/education" element={<Education />} />
            <Route path="/proyectos/:slug" element={<ProjectDetail />} />
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
