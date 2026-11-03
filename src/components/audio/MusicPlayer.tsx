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
/*  Track Selector                                                     */
/* ------------------------------------------------------------------ */

interface SelectorProps {
  current: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}

function TrackSelector({ current, onSelect, onClose }: SelectorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="bgm-selector"
      role="listbox"
      aria-label="Select track"
    >
      {TRACKS.map((t, i) => (
        <button
          key={t.file}
          role="option"
          aria-selected={i === current}
          className={`bgm-selector__item${i === current ? " bgm-selector__item--active" : ""}`}
          onClick={() => {
            onSelect(i);
            onClose();
          }}
        >
          <span className="bgm-selector__num">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="bgm-selector__title">{t.title}</span>
          {i === current && <span className="bgm-selector__now">▶</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Visualizer — 4 bars driven by Web Audio API AnalyserNode           */
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

export function MusicPlayer() {
  const booted = useBooted();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Web Audio API — created lazily on first user gesture to avoid
     React StrictMode double-mount destroying createMediaElementSource */
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  /* Imperative UI refs */
  const progressFillRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const volFillRef = useRef<HTMLDivElement>(null);

  /* Reactive state */
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);

  /* Ref mirrors (avoid stale closures) */
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const mutedRef = useRef(false);
  const trackIndexRef = useRef(0);

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
      setTrackIndex(index);
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
    [ensureAudioGraph],
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
    };
    document.addEventListener("pointerdown", onInteract);
    document.addEventListener("keydown", onInteract);
  }, [booted, loadAndPlay]);

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

  const selectTrack = useCallback(
    async (i: number) => {
      await ensureAudioGraph();
      loadAndPlay(i, true);
    },
    [loadAndPlay, ensureAudioGraph],
  );

  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (mutedRef.current) {
      a.muted = false;
      mutedRef.current = false;
      setMuted(false);
    } else {
      a.muted = true;
      mutedRef.current = true;
      setMuted(true);
    }
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * a.duration;
    /* Immediate visual feedback */
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct * 100}%`;
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = formatTime(pct * a.duration);
    }
  }, []);

  const changeVolume = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    volumeRef.current = pct;
    setVolume(pct);
    const a = audioRef.current;
    if (a && !mutedRef.current) a.volume = pct;
  }, []);

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

  const t = TRACKS[trackIndex];

  return (
    <>
      <audio ref={audioRef} preload="metadata" />

      <div className="bgm-player" aria-label="Music Player">
        {/* ── Compact bar (always visible inside BottomBar) ── */}
        <div className="bgm-bar">
          <button
            type="button"
            className="bgm-bar__label bgm-bar__label--btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`Sistema BGM: ${t.title}. ${expanded ? "Contraer" : "Expandir"} panel`}
          >
            ♫ MUSIC
          </button>
          <span className="bgm-bar__sep" />
          <button
            type="button"
            className="bgm-bar__track bgm-bar__track--btn"
            onClick={() => setSelectorOpen((v) => !v)}
            aria-label={`Pista ${trackIndex + 1} de ${TRACKS.length}: ${t.title}. Cambiar pista`}
          >
            {String(trackIndex + 1).padStart(2, "0")} /{" "}
            {String(TRACKS.length).padStart(2, "0")}
          </button>
          <span className="bgm-bar__title">{t.title}</span>
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

        {/* ── Expanded BGM System Panel ── */}
        {expanded && (
          <div className="bgm-panel">
            {/* Header: system label + track counter */}
            <div className="bgm-panel__head">
              <span className="bgm-panel__sys">BGM SYSTEM</span>
              <button
                type="button"
                className="bgm-panel__counter"
                onClick={() => setSelectorOpen((v) => !v)}
                aria-label={`Pista ${trackIndex + 1} de ${TRACKS.length}. Abrir selector de pistas`}
              >
                {String(trackIndex + 1).padStart(2, "0")} /{" "}
                {String(TRACKS.length).padStart(2, "0")}
              </button>
            </div>

            {/* Track title */}
            <div className="bgm-panel__track">
              <span className="bgm-panel__title">{t.title}</span>
            </div>

            {/* Transport controls */}
            <div className="bgm-panel__controls">
              <button
                className="bgm-ctrl"
                onClick={prevTrack}
                aria-label="Pista anterior"
              >
                <span className="bgm-ctrl__icon">◀</span>
                <span className="bgm-ctrl__label">PREV</span>
              </button>
              <button
                className="bgm-ctrl bgm-ctrl--play"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                <span className="bgm-ctrl__icon">{isPlaying ? "❚❚" : "▶"}</span>
                <span className="bgm-ctrl__label">
                  {isPlaying ? "PAUSE" : "PLAY"}
                </span>
              </button>
              <button
                className="bgm-ctrl"
                onClick={nextTrack}
                aria-label="Siguiente pista"
              >
                <span className="bgm-ctrl__icon">▶</span>
                <span className="bgm-ctrl__label">NEXT</span>
              </button>
            </div>

            {/* Progress bar */}
            <div className="bgm-panel__progress-wrap">
              <div
                className="bgm-progress"
                onMouseDown={seek}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(
                    0,
                    Math.min(1, (touch.clientX - rect.left) / rect.width),
                  );
                  const a = audioRef.current;
                  if (a && isFinite(a.duration) && a.duration > 0) {
                    a.currentTime = pct * a.duration;
                    if (progressFillRef.current)
                      progressFillRef.current.style.width = `${pct * 100}%`;
                    if (timeLabelRef.current)
                      timeLabelRef.current.textContent = formatTime(
                        pct * a.duration,
                      );
                  }
                }}
                role="slider"
                aria-label="Track progress"
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                onKeyDown={(e) => {
                  const a = audioRef.current;
                  if (!a || !isFinite(a.duration)) return;
                  if (e.key === "ArrowRight")
                    a.currentTime = Math.min(a.duration, a.currentTime + 5);
                  if (e.key === "ArrowLeft")
                    a.currentTime = Math.max(0, a.currentTime - 5);
                }}
              >
                <div className="bgm-progress__track" />
                <div ref={progressFillRef} className="bgm-progress__fill" />
              </div>
              <div className="bgm-panel__time">
                <span ref={timeLabelRef}>0:00</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="bgm-vol">
              <button
                className="bgm-vol__btn"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <div
                className="bgm-vol__track"
                onMouseDown={changeVolume}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(
                    0,
                    Math.min(1, (touch.clientX - rect.left) / rect.width),
                  );
                  volumeRef.current = pct;
                  setVolume(pct);
                  const a = audioRef.current;
                  if (a && !mutedRef.current) a.volume = pct;
                }}
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={muted ? 0 : Math.round(volume * 100)}
                tabIndex={0}
                onKeyDown={(e) => {
                  const step = 0.05;
                  if (e.key === "ArrowRight") {
                    volumeRef.current = Math.min(1, volumeRef.current + step);
                    setVolume(volumeRef.current);
                    const a = audioRef.current;
                    if (a && !mutedRef.current) a.volume = volumeRef.current;
                  }
                  if (e.key === "ArrowLeft") {
                    volumeRef.current = Math.max(0, volumeRef.current - step);
                    setVolume(volumeRef.current);
                    const a = audioRef.current;
                    if (a && !mutedRef.current) a.volume = volumeRef.current;
                  }
                }}
              >
                <div ref={volFillRef} className="bgm-vol__fill" />
              </div>
              <span className="bgm-vol__pct">
                {muted ? "0" : Math.round(volume * 100)}%
              </span>
            </div>

            {/* Visualizer */}
            <Visualizer analyser={analyser} />
          </div>
        )}

        {/* ── Track selector dropdown ── */}
        {selectorOpen && (
          <TrackSelector
            current={trackIndex}
            onSelect={selectTrack}
            onClose={() => setSelectorOpen(false)}
          />
        )}
      </div>
    </>
  );
}
