import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { TRACKS, DEFAULT_VOLUME } from "../../data/music";
import { useBooted } from "../../lib/boot";
import { gsap } from "gsap";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DISC_IMG = "/images/ui/music_disc.webp";

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0 || s !== s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function trackUrl(file: string): string {
  return `${import.meta.env.BASE_URL}audio/${encodeURIComponent(file)}`;
}

/* ------------------------------------------------------------------ */
/*  Session guard                                                      */
/* ------------------------------------------------------------------ */

let sessionDispatched = false;

/* ------------------------------------------------------------------ */
/*  Ecualizador de 5 barras (usa AnalyserNode si hay audio, si no CSS) */
/* ------------------------------------------------------------------ */

function Equalizer({
  analyser,
  isPlaying,
}: {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}) {
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const rafRef = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  useEffect(() => {
    if (!analyser || reducedMotion || !isPlaying) return;
    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bands = [
        Math.floor(bufLen * 0.04),
        Math.floor(bufLen * 0.1),
        Math.floor(bufLen * 0.18),
        Math.floor(bufLen * 0.3),
        Math.floor(bufLen * 0.45),
      ];
      for (let i = 0; i < 5; i++) {
        const el = barsRef.current[i];
        if (!el) continue;
        const start = Math.max(0, bands[i] - 2);
        const end = Math.min(bufLen - 1, bands[i] + 2);
        let sum = 0;
        for (let j = start; j <= end; j++) sum += data[j];
        const avg = sum / (end - start + 1);
        const h = 20 + (avg / 255) * 60;
        el.style.height = `${h}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, reducedMotion, isPlaying]);

  useEffect(() => {
    if (analyser && !reducedMotion && isPlaying) return;
    for (let i = 0; i < 5; i++) {
      const el = barsRef.current[i];
      if (el) el.style.height = "20%";
    }
  }, [analyser, reducedMotion, isPlaying]);

  return (
    <div className="p5-eq" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="p5-eq__bar"
          ref={(el) => {
            barsRef.current[i] = el!;
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MusicPlayer                                                        */
/*                                                                     */
/* Estado unico: currentIndex vive aqui. selectTrack() hace src/load/  */
/* play dentro del mismo handler (interaccion de usuario) y es el      */
/* unico punto de cambio de pista. Se expone a traves de un ref para   */
/* que BottomBar (menu de pistas) lo llame al hacer click en una fila. */
/* ------------------------------------------------------------------ */

export interface MusicPlayerHandle {
  selectTrack: (index: number) => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  readonly currentIndex: number;
  readonly isPlaying: boolean;
}

export const MusicPlayer = forwardRef<
  MusicPlayerHandle,
  {
    className?: string;
    style?: React.CSSProperties;
    onSelectorToggle?: () => void;
    onTrackChange?: (i: number) => void;
  }
>(({ className, style, onSelectorToggle, onTrackChange }, ref) => {
  const booted = useBooted();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const vinylRef = useRef<HTMLImageElement>(null);

  /* Titulo de la pista: marquee solo cuando no cabe. */
  const [marquee, setMarquee] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const check = () => setMarquee(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    if (ro) {
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, []);

  /* Estado unico de pista y reproduccion. */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const t = TRACKS[currentIndex];

  const isPlayingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(false);
  const trackIndexRef = useRef(currentIndex);
  const vinylAnimRef = useRef<gsap.core.Tween | null>(null);

  /* localStorage: recordar pista y volumen (try/catch). */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("p5:music");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.trackIndex === "number" &&
          parsed.trackIndex >= 0 &&
          parsed.trackIndex < TRACKS.length
        ) {
          setCurrentIndex(parsed.trackIndex);
          trackIndexRef.current = parsed.trackIndex;
        }
        if (typeof parsed.volume === "number") {
          volumeRef.current = parsed.volume;
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(
        "p5:music",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("p5:music") || "{}"),
          [key]: value,
        }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  /* Web Audio API */
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const ensureAudioGraph = useCallback(async () => {
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") {
        try {
          await ctxRef.current.resume();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(a);
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.6;
      src.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      ctxRef.current = ctx;
      sourceRef.current = src;
      setAnalyser(analyserNode);
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.warn("[BGM] Web Audio init failed:", err);
    }
  }, []);

  /* Vinilo: gira SOLO la imagen mientras suena y se frena al pausar. */
  const startVinyl = useCallback(() => {
    if (vinylAnimRef.current) vinylAnimRef.current.kill();
    const el = vinylRef.current;
    if (!el) return;
    vinylAnimRef.current = gsap.to(el, {
      rotation: "+=360",
      duration: 7,
      repeat: -1,
      ease: "none",
    });
  }, []);

  const stopVinyl = useCallback(() => {
    if (vinylAnimRef.current) vinylAnimRef.current.kill();
    const el = vinylRef.current;
    if (!el) return;
    const current = parseFloat(String(gsap.getProperty(el, "rotation") || "0"));
    gsap.to(el, {
      rotation: current + 40,
      duration: 0.9,
      ease: "power3.out",
    });
  }, []);

  /* Eventos de audio */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDuration(a.duration);
    const onTime = () => {
      setCurrentTime(a.currentTime);
      if (progressFillRef.current && isFinite(a.duration) && a.duration > 0) {
        progressFillRef.current.style.width = `${(a.currentTime / a.duration) * 100}%`;
      }
      if (timeLabelRef.current) {
        timeLabelRef.current.textContent = formatTime(a.currentTime);
      }
    };
    const onEnd = () => {
      const next = (trackIndexRef.current + 1) % TRACKS.length;
      selectTrackRef.current?.(next);
      onTrackChange?.(next);
      persist("trackIndex", next);
    };
    const onErr = (e: Event) => {
      console.warn("[BGM] Audio error:", (e.target as HTMLAudioElement)?.error);
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
    };
  }, [onTrackChange, persist]);

  const selectTrackRef = useRef<(index: number) => void>(null);

  const loadAndPlay = useCallback(
    (index: number, shouldPlay: boolean) => {
      const a = audioRef.current;
      if (!a) return;
      const prevVol = volumeRef.current;
      const wasMuted = mutedRef.current;

      a.pause();

      const prevCleanup = canplayCleanupRef.current;
      if (prevCleanup) {
        prevCleanup();
        canplayCleanupRef.current = null;
      }

      a.src = trackUrl(TRACKS[index].file);
      a.load();

      trackIndexRef.current = index;
      setCurrentIndex(index);
      setDuration(0);
      setCurrentTime(0);
      if (progressFillRef.current) progressFillRef.current.style.width = "0%";
      if (timeLabelRef.current) timeLabelRef.current.textContent = "0:00";

      const onReady = async () => {
        canplayCleanupRef.current = null;
        a.removeEventListener("canplay", onReady);
        a.volume = wasMuted ? 0 : prevVol;
        if (shouldPlay) {
          await ensureAudioGraph();
          try {
            await a.play();
            setIsPlaying(true);
            isPlayingRef.current = true;
            startVinyl();
          } catch (err) {
            console.warn("[BGM] Auto-play blocked:", err);
            setIsPlaying(false);
            isPlayingRef.current = false;
            stopVinyl();
          }
        }
      };
      canplayCleanupRef.current = () =>
        a.removeEventListener("canplay", onReady);
      a.addEventListener("canplay", onReady);
    },
    [ensureAudioGraph, startVinyl, stopVinyl],
  );

  const canplayCleanupRef = useRef<(() => void) | null>(null);

  const selectTrack = useCallback(
    (index: number) => {
      if (index < 0 || index >= TRACKS.length) return;
      loadAndPlay(index, true);
      persist("trackIndex", index);
      onTrackChange?.(index);
    },
    [loadAndPlay, onTrackChange, persist],
  );
  selectTrackRef.current = selectTrack;

  /* Auto-play primera pista al boot (tras primera interaccion). */
  useEffect(() => {
    if (sessionDispatched || !booted) return;
    sessionDispatched = true;
    const onInteract = async () => {
      document.removeEventListener("pointerdown", onInteract);
      document.removeEventListener("keydown", onInteract);
      await loadAndPlay(0, true);
      onTrackChange?.(0);
      persist("trackIndex", 0);
    };
    document.addEventListener("pointerdown", onInteract);
    document.addEventListener("keydown", onInteract);
  }, [booted, loadAndPlay, onTrackChange, persist]);

  useEffect(() => {
    if (isPlaying) {
      startVinyl();
    } else {
      stopVinyl();
    }
    return () => {
      if (vinylAnimRef.current) vinylAnimRef.current.kill();
    };
  }, [isPlaying, startVinyl, stopVinyl]);

  /* Controles */
  const togglePlay = useCallback(async () => {
    await ensureAudioGraph();
    const a = audioRef.current;
    if (!a) return;
    if (isPlayingRef.current) {
      a.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopVinyl();
    } else {
      try {
        await a.play();
        setIsPlaying(true);
        isPlayingRef.current = true;
        startVinyl();
      } catch (err) {
        console.warn("[BGM] Play blocked:", err);
      }
    }
  }, [ensureAudioGraph, startVinyl, stopVinyl]);

  const nextTrack = useCallback(async () => {
    await ensureAudioGraph();
    const next = (trackIndexRef.current + 1) % TRACKS.length;
    selectTrack(next);
    persist("trackIndex", next);
  }, [selectTrack, ensureAudioGraph, persist]);

  const prevTrack = useCallback(async () => {
    await ensureAudioGraph();
    const next = (trackIndexRef.current - 1 + TRACKS.length) % TRACKS.length;
    selectTrack(next);
    persist("trackIndex", next);
  }, [selectTrack, ensureAudioGraph, persist]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * a.duration;
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct * 100}%`;
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = formatTime(pct * a.duration);
    }
  }, []);

  /* Teclados */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextTrack();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevTrack();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, nextTrack, prevTrack]);

  /* API imperativa expuesta por ref. */
  useImperativeHandle(
    ref,
    () => ({
      selectTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      get currentIndex() {
        return currentIndex;
      },
      get isPlaying() {
        return isPlaying;
      },
    }),
    [selectTrack, togglePlay, nextTrack, prevTrack, currentIndex, isPlaying],
  );

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const PlayIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
  const PauseIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="6" height="16" />
      <rect x="14" y="4" width="6" height="16" />
    </svg>
  );
  const PrevIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="14,4 14,20 6,12" />
    </svg>
  );
  const NextIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="10,4 10,20 18,12" />
    </svg>
  );

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div
        className={`bgm-player p5-player-root ${className ?? ""} ${isPlaying ? "" : "paused"}`}
        style={style}
        aria-label="Music Player"
      >
        {/* Capas de la placa (fondo + borde, no recortan el disco) */}
        <div className="p5-player-plate">
          <div className="p5-plate__shadow" />
          <div className="p5-plate__border" />
          <div className="p5-plate__fill" />
        </div>

        {/* Disco: celda propia del grid, centrado, sobresale arriba/abajo */}
        <div className="p5-disc-cell">
          <div
            className={`p5-disc-ring ${isPlaying ? "p5-disc-ring--glow" : ""}`}
            aria-hidden="true"
          />
          <img
            ref={vinylRef}
            className="p5-disc"
            src={DISC_IMG}
            alt=""
            aria-hidden="true"
          />
        </div>

        {/* Contenido: info + controles + progreso + tiempo + ecualizador + lista */}
        <div className="p5-content-cell">
          <div className="p5-player-header">
            <span className="p5-player-now">NOW PLAYING</span>
            <span className="p5-player-counter">
              {String(currentIndex + 1).padStart(2, "0")}/
              {String(TRACKS.length).padStart(2, "0")}
            </span>
          </div>

          <div className="p5-player-title-wrap">
            <span
              className={`p5-player-title${marquee ? " marquee" : ""}`}
              ref={titleRef}
            >
              {t.title}
            </span>
          </div>

          <div className="p5-player-footer">
            {/* Izquierda: controles */}
            <div className="p5-player-transport">
              <button
                type="button"
                className="p5-ctrl-btn"
                onClick={prevTrack}
                aria-label="Pista anterior"
              >
                {PrevIcon}
              </button>
              <button
                type="button"
                className="p5-ctrl-btn p5-ctrl-btn--play"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? PauseIcon : PlayIcon}
              </button>
              <button
                type="button"
                className="p5-ctrl-btn"
                onClick={nextTrack}
                aria-label="Siguiente pista"
              >
                {NextIcon}
              </button>
            </div>

            {/* Centro: barra de progreso que ocupa el espacio restante */}
            <div
              className="p5-player-progress-wrap"
              onMouseDown={seek}
              role="slider"
              aria-label="Progreso de pista"
              tabIndex={0}
            >
              <div className="p5-player-progress" ref={progressFillRef} />
            </div>

            {/* Derecha: tiempo, ecualizador y boton lista */}
            <span className="p5-player-time" ref={timeLabelRef}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <Equalizer analyser={analyser} isPlaying={isPlaying} />
            <div className="p5-list-btn-cell">
              <button
                type="button"
                className="p5-list-btn"
                onClick={onSelectorToggle}
                aria-label="Abrir lista de pistas"
              >
                ≡
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default MusicPlayer;
