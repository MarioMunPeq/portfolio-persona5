import { useCallback, useEffect, useRef, useState } from "react";

const poster = "/images/background/background_redstars.webp";
const videoSource = "/images/background/background_blackstars.webm";
const mp4FallbackSource =
  "/images/background/background_blackstars_fallback.mp4";

interface PageBackgroundProps {
  variant: "profile" | "projects";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function PageBackground({ variant }: PageBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [videoSourceUrl, setVideoSourceUrl] = useState(videoSource);

  const handleVideoError = useCallback((failedSource: string) => {
    setVideoSourceUrl((currentSource) => {
      if (currentSource !== failedSource) return currentSource;
      return currentSource === videoSource ? mp4FallbackSource : "";
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [handleVideoError, reducedMotion, variant, videoSourceUrl]);

  return (
    <div
      className={`page-background page-background--${variant}`}
      aria-hidden="true"
    >
      {!reducedMotion && videoSourceUrl && (
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
      )}
      {(reducedMotion || !videoSourceUrl) && (
        <div className="page-background__poster" />
      )}
      <div className="page-background__overlay" />
    </div>
  );
}
