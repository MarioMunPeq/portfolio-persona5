export const TRANSITION_SPEED = 3;

/** Time in ms after which the video has visually covered the screen.
 *  At 2x speed this is ~500ms of actual video content — enough for the
 *  train wipe to fill the viewport before the destination renders. */
const COVER_MS = 1000;

/**
 * Global flag checked by TransitionRoutes to avoid double-triggering
 * when CommandNavItem has already started the transition externally.
 */
let transitionExternallyStarted = false;

export const transitionBus = {
  /** Mark that a transition was started outside TransitionRoutes. */
  markExternallyStarted() {
    transitionExternallyStarted = true;
  },

  /** Returns true if a transition was already started externally, then resets. */
  consumeExternallyStarted(): boolean {
    if (transitionExternallyStarted) {
      transitionExternallyStarted = false;
      return true;
    }
    return false;
  },

  /**
   * Play the full transition video (used by TransitionRoutes for
   * non-button-triggered route changes).
   */
  play(onDone: () => void) {
    const video = document.getElementById(
      "transition-video",
    ) as HTMLVideoElement | null;
    if (!video) {
      onDone();
      return;
    }

    video.currentTime = 0;
    video.hidden = false;
    video.playbackRate = TRANSITION_SPEED;

    const cleanup = () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onEnded);
    };

    const onEnded = () => {
      cleanup();
      /* Señal de fin de transición para la página de destino */
      document.documentElement.setAttribute("data-transition", "done");
      window.dispatchEvent(new CustomEvent("page-transition-done"));
      onDone();
    };

    video.addEventListener("ended", onEnded, { once: true });
    video.addEventListener("error", onEnded, { once: true });

    video.play().catch(cleanup);
  },

  playUntilCovered(): Promise<void> {
    return new Promise((resolve) => {
      const video = document.getElementById(
        "transition-video",
      ) as HTMLVideoElement | null;
      if (!video) {
        resolve();
        return;
      }

      video.currentTime = 0;
      video.hidden = false;
      video.playbackRate = TRANSITION_SPEED;

      let resolved = false;
      let retryCount = 0;
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 300;

      const cleanup = () => {
        window.clearTimeout(fallbackTimer);
        window.clearTimeout(retryTimer);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onError);
      };

      const startCoverTimer = () => {
        window.setTimeout(() => {
          if (resolved) return;
          resolved = true;
          cleanup();
          document.documentElement.setAttribute("data-transition", "done");
          window.dispatchEvent(new CustomEvent("page-transition-done"));
          resolve();
        }, COVER_MS);
      };

      const fallbackTimer = window.setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        document.documentElement.setAttribute("data-transition", "done");
        window.dispatchEvent(new CustomEvent("page-transition-done"));
        resolve();
      }, COVER_MS + 2600);

      let retryTimer = 0;

      const onPlaying = () => {
        if (resolved) return;
        cleanup();
        startCoverTimer();
      };

      const onError = () => {
        if (resolved) return;
        attemptRecovery();
      };

      const attemptPlay = () => {
        if (resolved) return;
        video.play().catch(() => {
          if (resolved) return;
          attemptRecovery();
        });
      };

      const attemptRecovery = () => {
        if (resolved) return;
        if (retryCount >= MAX_RETRIES) return;
        retryCount++;
        video.load();
        retryTimer = window.setTimeout(() => {
          if (!resolved) attemptPlay();
        }, RETRY_DELAY_MS);
      };

      video.addEventListener("playing", onPlaying, { once: true });
      video.addEventListener("error", onError);

      if (!video.paused && video.readyState >= 3) {
        cleanup();
        startCoverTimer();
        return;
      }

      attemptPlay();
    });
  },
};
