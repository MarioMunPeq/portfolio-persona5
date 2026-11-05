import { useState, useEffect, useRef, useCallback } from "react";
import { TRACKS, DEFAULT_VOLUME } from "../../data/music";
import { useBooted } from "../../lib/boot";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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
/*  Session guard — survives StrictMode double-mount, route changes,   */
/*  and component unmount/remount. Module-level, not a useRef.         */
/* ------------------------------------------------------------------ */

let sessionDispatched = false;

/* ------------------------------------------------------------------ */
/*  Visualizer — 6 bars driven by Web Audio API AnalyserNode           */
/* ------------------------------------------------------------------ */

function Visualizer({ analyser }: { analyser: AnalyserNode | null }) {
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const rafRef = useRef(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  useEffect(() => {
    if (!analyser || reducedMotion) return;
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
        Math.floor(bufLen * 0.6),
      ];
      for (let i = 0; i < 6; i++) {
        const el = barsRef.current[i];
        if (!el) continue;
        const start = Math.max(0, bands[i] - 2);
        const end = Math.min(bufLen - 1, bands[i] + 2);
        let sum = 0;
        for (let j = start; j <= end; j++) sum += data[j];
        const avg = sum / (end - start + 1);
        const h = 3 + (avg / 255) * 15;
        el.style.height = `${h}px`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, reducedMotion]);

  useEffect(() => {
    if (analyser && !reducedMotion) return;
    for (let i = 0; i < 6; i++) {
      const el = barsRef.current[i];
      if (el) el.style.height = "3px";
    }
  }, [analyser, reducedMotion]);

  return (
    <div className="bgm-viz" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="bgm-viz__bar"
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
/* ------------------------------------------------------------------ */

export function MusicPlayer({
  className,
  style,
  flat = false,
  onSelectorToggle,
  trackIndex: trackIndexProp,
  onTrackChange,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Cuando true, omite fondo/borde/padding de .bgm-bar (el wrapper .p5-plate
     provee el marco). */
  flat?: boolean;
  /** Callback para abrir/cerrar el menú. */
  onSelectorToggle?: () => void;
  /** Índice de pista controlado externamente (BottomBar). */
  trackIndex?: number;
  /** Callback cuando cambia la pista (audio terminado, selección manual). */
  onTrackChange?: (i: number) => void;
} = {}) {
  const booted = useBooted();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const volFillRef = useRef<HTMLDivElement>(null);

  /* Título de la pista: marquee solo cuando no cabe en el espacio disponible. */
  const titleRef = useRef<HTMLSpanElement>(null);
  const [marquee, setMarquee] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const check = () => setMarquee(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(check)
        : null;
    if (ro) {
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, []);

  /* Reactive state */
  const [internalTrackIndex, setInternalTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(DEFAULT_VOLUME);
  const [muted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [, setDuration] = useState(0);

  /* Índice de pista visible: prop controlada si se pasa, si no estado interno. */
  const displayTrackIndex = trackIndexProp ?? internalTrackIndex;

  /* Ref mirrors (avoid stale closures) */
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(false);
  const trackIndexRef = useRef(displayTrackIndex);

  /* Cleanup ref for pending canplay listener */
  const canplayCleanupRef = useRef<(() => void) | null>(null);

  /* ================================================================ */
  /*  AudioContext + Web Audio graph (created lazily on first gesture)  */
  /* ================================================================ */

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

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  /* ================================================================ */
  /*  Audio event handlers                                             */
  /* ================================================================ */

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => setDuration(a.duration);
    const onTime = () => {
      if (progressFillRef.current && isFinite(a.duration) && a.duration > 0) {
        progressFillRef.current.style.width = `${(a.currentTime / a.duration) * 100}%`;
      }
      if (timeLabelRef.current) {
        timeLabelRef.current.textContent = formatTime(a.currentTime);
      }
    };
    const onEnd = () => {
      const next = (trackIndexRef.current + 1) % TRACKS.length;
      loadAndPlay(next, true);
      onTrackChange?.(next);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================================================================ */
  /*  Core: load a track and optionally auto-play                      */
  /* ================================================================ */

  const loadAndPlay = useCallback(
    (index: number, shouldPlay: boolean) => {
      const a = audioRef.current;
      if (!a) return;
      const prevVol = volumeRef.current;
      const wasMuted = mutedRef.current;

      a.pause();

      /* Clean up any pending canplay from a previous loadAndPlay call */
      if (canplayCleanupRef.current) {
        canplayCleanupRef.current();
        canplayCleanupRef.current = null;
      }

      a.src = trackUrl(TRACKS[index].file);
      a.load();

      trackIndexRef.current = index;
      setInternalTrackIndex(index);
      onTrackChange?.(index);
      setDuration(0);
      if (progressFillRef.current) progressFillRef.current.style.width = "0%";
      if (timeLabelRef.current) timeLabelRef.current.textContent = "0:00";

      const onReady = async () => {
        canplayCleanupRef.current = null;
        a.removeEventListener("canplay", onReady);
        a.volume = wasMuted ? 0 : prevVol;
        if (shouldPlay) {
          await ensureAudioGraph();
          const ctxOk = !ctxRef.current || ctxRef.current.state === "running";
          if (ctxOk) {
            try {
              await a.play();
              setIsPlaying(true);
              isPlayingRef.current = true;
            } catch (err) {
              console.warn("[BGM] Auto-play blocked:", err);
              setIsPlaying(false);
              isPlayingRef.current = false;
            }
          }
        }
      };
      canplayCleanupRef.current = () =>
        a.removeEventListener("canplay", onReady);
      a.addEventListener("canplay", onReady);
    },
    [ensureAudioGraph, onTrackChange],
  );

  /* ================================================================ */
  /*  Auto-play "What's Going On" ONCE after boot, on first user       */
  /*  interaction. Chrome blocks non-muted audio autoplay without      */
  /*  user activation, so we wait for the first pointer/keydown        */
  /*  after boot. Module-level guard survives StrictMode/route changes. */
  /* ================================================================ */

  useEffect(() => {
    if (sessionDispatched || !booted) return;
    sessionDispatched = true;

    const onInteract = async () => {
      document.removeEventListener("pointerdown", onInteract);
      document.removeEventListener("keydown", onInteract);
      await loadAndPlay(0, true);
      onTrackChange?.(0);
    };
    document.addEventListener("pointerdown", onInteract);
    document.addEventListener("keydown", onInteract);
  }, [booted, loadAndPlay, onTrackChange]);

  /* ================================================================ */
  /*  Controls                                                         */
  /* ================================================================ */

  const togglePlay = useCallback(async () => {
    await ensureAudioGraph();
    const a = audioRef.current;
    if (!a) return;

    if (isPlayingRef.current) {
      a.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      try {
        await a.play();
        setIsPlaying(true);
        isPlayingRef.current = true;
      } catch (err) {
        console.warn("[BGM] Play blocked:", err);
      }
    }
  }, [ensureAudioGraph]);

  const nextTrack = useCallback(async () => {
    await ensureAudioGraph();
    loadAndPlay(
      (trackIndexRef.current + 1) % TRACKS.length,
      isPlayingRef.current,
    );
  }, [loadAndPlay, ensureAudioGraph]);

  const prevTrack = useCallback(async () => {
    await ensureAudioGraph();
    loadAndPlay(
      (trackIndexRef.current - 1 + TRACKS.length) % TRACKS.length,
      isPlayingRef.current,
    );
  }, [loadAndPlay, ensureAudioGraph]);

  /* ================================================================ */
  /*  Keyboard shortcuts                                               */
  /* ================================================================ */

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

  /* ================================================================ */
  /*  Volume fill bar imperative update                                */
  /* ================================================================ */

  useEffect(() => {
    if (volFillRef.current) {
      volFillRef.current.style.width = `${(muted ? 0 : volume) * 100}%`;
    }
  }, [volume, muted]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const t = TRACKS[displayTrackIndex];

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className="bgm-player" aria-label="Music Player">
        {/* ── Compact bar (always visible inside BottomBar) ── */}
        <div
          className={`bgm-bar ${flat ? "bgm-bar--flat" : ""} ${className ?? ""}`}
          style={style}
        >
          <button
            type="button"
            className="bgm-bar__label bgm-bar__label--btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`Sistema BGM: ${t.title}. ${expanded ? "Contraer" : "Expandir"} panel`}
          >
            ♪
          </button>
          <button
            type="button"
            className="bgm-bar__track bgm-bar__track--btn"
            onClick={onSelectorToggle}
            aria-label={`Pista ${displayTrackIndex + 1} de ${TRACKS.length}: ${t.title}. Cambiar pista`}
          >
            {String(displayTrackIndex + 1).padStart(2, "0")} /{" "}
            {String(TRACKS.length).padStart(2, "0")}
          </button>
          <span className="bgm-bar__title-wrap">
            <span
              className={`bgm-bar__title${marquee ? " marquee" : ""}`}
              ref={titleRef}
            >
              {t.title}
            </span>
          </span>
          <button
            type="button"
            className="bgm-bar__play"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <Visualizer analyser={analyser} />
        </div>
      </div>
    </>
  );
}
