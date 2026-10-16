/**
 * Background Audio Controller for love-only.mp3
 * Handles automatic playback with browser autoplay policy fallback:
 * - Attempts immediate playback on page load.
 * - If blocked by browser policy, automatically starts upon the first user interaction anywhere.
 * - Provides smooth fade in/out and synchronized button UI.
 */
export class SoundController {
  constructor() {
    this.audio = new Audio('/love-only.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.75;
    this.audio.preload = 'auto';

    this.isPlaying = false;
    this.initialized = false;
  }

  initAutoPlay(onStateChange) {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Try immediate autoplay
    const promise = this.audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          this.isPlaying = true;
          if (onStateChange) onStateChange(true);
        })
        .catch(() => {
          // Browser prevented autoplay without interaction
          // Automatically trigger on first touch, click or keypress
          const unlockAudio = () => {
            if (!this.isPlaying) {
              this.audio.play().then(() => {
                this.isPlaying = true;
                if (onStateChange) onStateChange(true);
              }).catch(() => {});
            }
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
          };

          window.addEventListener('pointerdown', unlockAudio, { once: true });
          window.addEventListener('touchstart', unlockAudio, { once: true });
          window.addEventListener('keydown', unlockAudio, { once: true });
        });
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    } else {
      this.audio.play().then(() => {
        this.isPlaying = true;
      }).catch((e) => console.log('Audio playback prevented:', e));
    }
    return this.isPlaying;
  }

  playHeartbeat() {
    // Subtle volume duck or accent if needed
  }

  playSparkleChime() {
    // Light sparkle
  }
}
