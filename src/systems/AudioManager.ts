type SoundKey =
  | 'shoot'
  | 'hit'
  | 'enemy-death'
  | 'elite-death'
  | 'boss-death'
  | 'level-up'
  | 'xp-pickup'
  | 'coin-pickup'
  | 'health-pickup'
  | 'bloodstone-pickup'
  | 'player-hit'
  | 'game-over'
  | 'ui-click'
  | 'boss-spawn'
  | 'evolve'
  | 'bgm';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function generateBuffer(
  sampleRate: number,
  duration: number,
  generator: (offset: number) => number
): AudioBuffer {
  const ctx = getAudioCtx();
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = generator(i / sampleRate);
  }

  return buffer;
}

function envelope(t: number, attack: number, decay: number, sustain: number, release: number, duration: number): number {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < duration - release) return sustain;
  if (t < duration) return sustain * ((duration - t) / release);
  return 0;
}

function noise(): number {
  return Math.random() * 2 - 1;
}

function sine(freq: number, t: number): number {
  return Math.sin(2 * Math.PI * freq * t);
}

function square(freq: number, t: number): number {
  return sine(freq, t) > 0 ? 1 : -1;
}

function saw(freq: number, t: number): number {
  return 2 * ((t * freq) % 1) - 1;
}

const SAMPLE_RATE = 22050;

const GENERATORS: Record<SoundKey, () => AudioBuffer> = {
  shoot: () => generateBuffer(SAMPLE_RATE, 0.08, (t) => {
    const env = envelope(t, 0.005, 0.02, 0.3, 0.03, 0.08);
    return (square(880, t) * 0.3 + noise() * 0.15) * env;
  }),

  hit: () => generateBuffer(SAMPLE_RATE, 0.1, (t) => {
    const env = envelope(t, 0.003, 0.03, 0.2, 0.04, 0.1);
    return (square(220, t) * 0.2 + noise() * 0.3) * env;
  }),

  'enemy-death': () => generateBuffer(SAMPLE_RATE, 0.15, (t) => {
    const env = envelope(t, 0.005, 0.04, 0.15, 0.06, 0.15);
    const freq = 300 - t * 800;
    return (square(freq, t) * 0.15 + noise() * 0.2) * env;
  }),

  'elite-death': () => generateBuffer(SAMPLE_RATE, 0.25, (t) => {
    const env = envelope(t, 0.01, 0.06, 0.2, 0.1, 0.25);
    const freq = 400 - t * 600;
    return (square(freq, t) * 0.2 + saw(150, t) * 0.1 + noise() * 0.15) * env;
  }),

  'boss-death': () => generateBuffer(SAMPLE_RATE, 0.6, (t) => {
    const env = envelope(t, 0.02, 0.1, 0.3, 0.3, 0.6);
    const freq = 200 - t * 200;
    return (saw(freq, t) * 0.2 + square(freq * 0.5, t) * 0.15 + noise() * 0.15) * env;
  }),

  'level-up': () => generateBuffer(SAMPLE_RATE, 0.4, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteLen = 0.1;
    const idx = Math.min(Math.floor(t / noteLen), notes.length - 1);
    const localT = t - idx * noteLen;
    const env = envelope(localT, 0.01, 0.03, 0.6, 0.04, noteLen);
    return sine(notes[idx], localT) * env * 0.25;
  }),

  'xp-pickup': () => generateBuffer(SAMPLE_RATE, 0.06, (t) => {
    const env = envelope(t, 0.005, 0.02, 0.1, 0.02, 0.06);
    const freq = 600 + t * 400;
    return sine(freq, t) * env * 0.15;
  }),

  'coin-pickup': () => generateBuffer(SAMPLE_RATE, 0.1, (t) => {
    const env = envelope(t, 0.005, 0.03, 0.2, 0.04, 0.1);
    return (sine(1200, t) * 0.2 + sine(1800, t) * 0.1) * env;
  }),

  'health-pickup': () => generateBuffer(SAMPLE_RATE, 0.12, (t) => {
    const env = envelope(t, 0.01, 0.04, 0.3, 0.05, 0.12);
    return (sine(440, t) * 0.15 + sine(660, t) * 0.1) * env;
  }),

  'bloodstone-pickup': () => generateBuffer(SAMPLE_RATE, 0.15, (t) => {
    const env = envelope(t, 0.01, 0.04, 0.3, 0.06, 0.15);
    return (sine(330, t) * 0.15 + sine(495, t) * 0.1 + sine(660, t) * 0.08) * env;
  }),

  'player-hit': () => generateBuffer(SAMPLE_RATE, 0.15, (t) => {
    const env = envelope(t, 0.003, 0.04, 0.15, 0.06, 0.15);
    return (saw(120, t) * 0.25 + noise() * 0.2) * env;
  }),

  'game-over': () => generateBuffer(SAMPLE_RATE, 0.8, (t) => {
    const env = envelope(t, 0.02, 0.15, 0.25, 0.4, 0.8);
    const freq = 220 * Math.pow(0.5, t * 0.8);
    return (saw(freq, t) * 0.15 + square(freq * 0.5, t) * 0.1) * env;
  }),

  'ui-click': () => generateBuffer(SAMPLE_RATE, 0.04, (t) => {
    const env = envelope(t, 0.003, 0.01, 0.1, 0.015, 0.04);
    return sine(1000, t) * env * 0.2;
  }),

  'boss-spawn': () => generateBuffer(SAMPLE_RATE, 0.8, (t) => {
    const env = envelope(t, 0.05, 0.2, 0.4, 0.3, 0.8);
    const freq = 55 + t * 30;
    return (saw(freq, t) * 0.2 + square(freq * 1.5, t) * 0.1 + noise() * 0.1) * env;
  }),

  evolve: () => generateBuffer(SAMPLE_RATE, 0.5, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const noteLen = 0.1;
    const idx = Math.min(Math.floor(t / noteLen), notes.length - 1);
    const localT = t - idx * noteLen;
    const env = envelope(localT, 0.01, 0.03, 0.5, 0.04, noteLen);
    return (sine(notes[idx], localT) * 0.2 + square(notes[idx] * 0.5, localT) * 0.08) * env;
  }),

  bgm: () => {
    const duration = 16;
    return generateBuffer(SAMPLE_RATE, duration, (t) => {
      const loopT = t % 8;
      const bass = saw(55, t) * 0.04 * (0.5 + 0.5 * sine(0.25, t));
      const pad = sine(110 + sine(0.1, t) * 10, t) * 0.025;
      const drone = sine(82.41, t) * 0.02 * envelope(loopT, 0.5, 1, 0.7, 1, 8);
      const atmosphere = noise() * 0.008 * envelope(loopT, 2, 1, 0.5, 2, 8);
      const pulse = sine(220, t) * 0.015 * Math.max(0, sine(2, t));
      return bass + pad + drone + atmosphere + pulse;
    });
  },
};

export class AudioManager {
  private scene: Phaser.Scene;
  private masterVolume = 0.5;
  private sfxVolume = 0.7;
  private musicVolume = 0.3;
  private bgmKey: Phaser.Sound.BaseSound | null = null;
  private muted = false;
  private static registered = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.registerAll();
  }

  private registerAll(): void {
    if (AudioManager.registered) {
      return;
    }

    AudioManager.registered = true;
    const ctx = getAudioCtx();

    for (const [key, gen] of Object.entries(GENERATORS)) {
      try {
        const buffer = gen();

        if (!this.scene.cache.audio.exists(key)) {
          this.scene.cache.audio.add(key, buffer);
        }
      } catch {
        // Web Audio not available - sounds disabled
      }
    }
  }

  play(key: SoundKey, options?: { volume?: number }): void {
    if (this.muted || !this.scene.cache.audio.exists(key)) {
      return;
    }

    try {
      this.scene.sound.play(key, {
        volume: this.masterVolume * this.sfxVolume * (options?.volume ?? 1),
      });
    } catch {
      // Sound playback failed silently
    }
  }

  startBgm(): void {
    if (this.muted || this.bgmKey?.isPlaying) {
      return;
    }

    try {
      if (this.scene.cache.audio.exists('bgm')) {
        this.bgmKey = this.scene.sound.add('bgm', {
          volume: this.masterVolume * this.musicVolume,
          loop: true,
        });
        this.bgmKey.play();
      }
    } catch {
      // BGM playback failed silently
    }
  }

  stopBgm(): void {
    if (this.bgmKey?.isPlaying) {
      this.bgmKey.stop();
    }
    this.bgmKey = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;

    if (this.muted) {
      this.stopBgm();
    }

    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  destroy(): void {
    this.stopBgm();
  }
}
