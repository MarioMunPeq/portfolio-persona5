import { Navigate, useParams } from "react-router-dom";

/**
 * Las fichas de proyecto se sirvieron historicamente en `/proyectos/:slug`
 * (unico caso de ruta en español de todo el sitio) mientras el resto de
 * rutas son en ingles. Ahora viven en `/projects/:slug`, pero las URLs
 * antiguas ya estan publicadas en LinkedIn, emails y portfolios
 * ajenos: esta ruta las recoge y redirige con `replace` para que la
 * navegacion no ensucie el historial del navegador.
 */
export function LegacyProjectRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/projects/${slug}`} replace />;
}
