import { useCallback, useEffect, useRef, useState } from "react";

const poster = "/images/background/background_redstars.webp";
const videoSource = "/images/background/background_blackstars.webm";
const mp4FallbackSource =
  "/images/background/background_blackstars_fallback.mp4";
const MOBILE_QUERY = "(max-width: 767px), (hover: none) and (pointer: coarse)";

interface PageBackgroundProps {
  variant: "profile" | "projects" | "education";
}

function isMobileMatch() {
  return (
    typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PageBackground({ variant }: PageBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /* Lectura síncrona en el primer render: en móvil nunca se monta el
     <video>, ni siquiera un instante antes de detectar. */
  const [isMobile, setIsMobile] = useState(isMobileMatch);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [videoSourceUrl, setVideoSourceUrl] = useState(videoSource);

  /* Reacciona a rotación y redimensionado: desktop -> móvil desmonta el
     <video>, móvil -> desktop lo monta de nuevo. */
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const handleVideoError = useCallback((failedSource: string) => {
    setVideoSourceUrl((currentSource) => {
      if (currentSource !== failedSource) return currentSource;
      return currentSource === videoSource ? mp4FallbackSource : "";
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isMobile) return;

    const syncPlayback = () => {
      if (document.hidden || reducedMotion || !videoSourceUrl) {
        video.pause();
        return;
      }

      void video.play().catch(() => handleVideoError(videoSourceUrl));
    };
    const onVisibilityChange = () => syncPlayback();

    document.addEventListener("visibilitychange", onVisibilityChange);
    syncPlayback();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.pause();
    };
  }, [handleVideoError, reducedMotion, variant, videoSourceUrl, isMobile]);

  /* Al pasar de desktop a móvil se libera el vídeo para bajar el consumo
     de memoria y ancho de banda. */
  useEffect(() => {
    if (!isMobile) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
  }, [isMobile]);

  return (
    <div
      className={`page-background page-background--${variant}`}
      aria-hidden="true"
    >
      {isMobile ? (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="low"
          className="page-background__mobile-img"
        />
      ) : !reducedMotion && videoSourceUrl ? (
        <video
          ref={videoRef}
          className="page-background__video"
          src={videoSourceUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          onError={() => handleVideoError(videoSourceUrl)}
        />
      ) : (
        <div className="page-background__poster" />
      )}
      <div className="page-background__overlay" />
    </div>
  );
}
