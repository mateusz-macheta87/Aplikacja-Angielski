// Hybrid Studio ElevenLabs Audio Sprite + Web Audio API + Web Speech API fallback engine
// Plays millisecond-accurate British English studio recordings offline on iPad Safari,
// with automatic fallback to Web Speech API for custom/non-English modules.

import { AudioSpriteCue, KROPKA_SPRITE_URL } from '../data/kropkaAudioSprite';
import { resolveSpriteSequence } from './spriteResolver';

let audioCtx: AudioContext | null = null;
let spriteRawBytes: ArrayBuffer | null = null;
let spriteRawPromise: Promise<ArrayBuffer | null> | null = null;
let spriteBuffer: AudioBuffer | null = null;
let spriteBufferPromise: Promise<AudioBuffer | null> | null = null;
let activeSources: AudioBufferSourceNode[] = [];
let activeTimers: number[] = [];
let activeRafId: number | null = null;
let slowAudioEl: HTMLAudioElement | null = null;
let playbackToken = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Prefetches raw MP3 bytes on page load without instantiating AudioContext (prevents iPad/Chrome autoplay warnings)
export function preloadAudioSprite(): Promise<ArrayBuffer | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (spriteRawBytes) return Promise.resolve(spriteRawBytes);
  if (spriteRawPromise) return spriteRawPromise;

  spriteRawPromise = fetch(KROPKA_SPRITE_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((arr) => {
      spriteRawBytes = arr;
      return arr;
    })
    .catch(() => {
      spriteRawPromise = null;
      return null;
    });

  return spriteRawPromise;
}

function ensureSpriteBuffer(): Promise<AudioBuffer | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (spriteBuffer) return Promise.resolve(spriteBuffer);
  if (spriteBufferPromise) return spriteBufferPromise;

  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);

  spriteBufferPromise = preloadAudioSprite()
    .then((arr) => {
      if (!arr) return null;
      // Copy ArrayBuffer before decoding because decodeAudioData detaches its input
      return ctx.decodeAudioData(arr.slice(0));
    })
    .then((decoded) => {
      if (decoded) {
        spriteBuffer = decoded;
      } else {
        spriteBufferPromise = null;
      }
      return decoded;
    })
    .catch(() => {
      spriteBufferPromise = null;
      return null;
    });

  return spriteBufferPromise;
}

function getSlowAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!slowAudioEl) {
    const el = new Audio(KROPKA_SPRITE_URL);
    el.preload = 'auto';
    // Preserve natural British voice pitch when slowed down for 8-year-old learners
    const pitchEl = el as HTMLAudioElement & {
      preservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
      mozPreservesPitch?: boolean;
    };
    pitchEl.preservesPitch = true;
    pitchEl.webkitPreservesPitch = true;
    pitchEl.mozPreservesPitch = true;
    slowAudioEl = el;
  }
  return slowAudioEl;
}

export function playToneEffect(
  kind: 'tap' | 'success' | 'tryAgain' | 'paint' | 'fanfare',
  enabled = true
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playNote = (
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + startOffset);
    gain.gain.setValueAtTime(0.001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(volume, now + startOffset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  if (kind === 'tap') {
    playNote(520, 0, 0.07, 'triangle', 0.09);
  } else if (kind === 'paint') {
    playNote(440, 0, 0.06, 'sine', 0.1);
    playNote(660, 0.05, 0.09, 'triangle', 0.11);
  } else if (kind === 'success') {
    playNote(523.25, 0, 0.12, 'triangle', 0.14); // C5
    playNote(659.25, 0.09, 0.14, 'triangle', 0.14); // E5
    playNote(783.99, 0.18, 0.22, 'triangle', 0.16); // G5
  } else if (kind === 'tryAgain') {
    playNote(310, 0, 0.12, 'sine', 0.1);
    playNote(260, 0.11, 0.18, 'sine', 0.1);
  } else if (kind === 'fanfare') {
    playNote(523.25, 0, 0.12, 'triangle', 0.15);
    playNote(659.25, 0.11, 0.12, 'triangle', 0.15);
    playNote(783.99, 0.22, 0.14, 'triangle', 0.15);
    playNote(1046.5, 0.35, 0.35, 'triangle', 0.18);
  }
}

export interface SpeakOptions {
  lang?: string;
  rate?: 'normal' | 'slow';
  onStart?: () => void;
  onEnd?: () => void;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  playbackToken += 1;

  for (const src of activeSources) {
    try {
      src.stop();
      src.disconnect();
    } catch {
      // Ignore already stopped buffer source
    }
  }
  activeSources = [];

  for (const id of activeTimers) {
    clearTimeout(id);
  }
  activeTimers = [];

  if (activeRafId !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }

  if (slowAudioEl) {
    try {
      slowAudioEl.pause();
    } catch {
      // Ignore pause errors
    }
  }

  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors in restricted browsers
    }
  }
}

function playBufferSequence(
  buffer: AudioBuffer,
  cues: AudioSpriteCue[],
  playbackRate: number,
  token: number,
  onStart?: () => void,
  onEnd?: () => void
): void {
  const ctx = getAudioContext();
  if (!ctx || token !== playbackToken) {
    onEnd?.();
    return;
  }

  onStart?.();

  let cursor = ctx.currentTime + 0.015;
  const gapSec = 0.18;

  for (const cue of cues) {
    const rawDuration = Math.max(0.08, cue.end - cue.start);
    const scaledDuration = rawDuration / playbackRate;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    // Tiny 8ms fade-in/out envelope prevents any edge click
    const gain = ctx.createGain();
    const fade = Math.min(0.01, scaledDuration / 4);
    gain.gain.setValueAtTime(0.001, cursor);
    gain.gain.linearRampToValueAtTime(1.0, cursor + fade);
    gain.gain.setValueAtTime(1.0, Math.max(cursor + fade, cursor + scaledDuration - fade));
    gain.gain.linearRampToValueAtTime(0.001, cursor + scaledDuration);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(cursor, cue.start, rawDuration);
    activeSources.push(source);

    cursor += scaledDuration + gapSec;
  }

  const totalMs = Math.max(120, Math.round((cursor - ctx.currentTime - gapSec) * 1000) + 40);
  const timerId = window.setTimeout(() => {
    if (token === playbackToken) {
      activeSources = [];
      onEnd?.();
    }
  }, totalMs);
  activeTimers.push(timerId);
}

function playSlowHtmlSequence(
  cues: AudioSpriteCue[],
  token: number,
  onStart?: () => void,
  onEnd?: () => void,
  onFail?: () => void
): void {
  const audio = getSlowAudioElement();
  if (!audio) {
    onFail?.();
    return;
  }

  const slowRate = 0.78;
  let index = 0;
  let started = false;

  const playNextCue = () => {
    if (token !== playbackToken) return;
    if (index >= cues.length) {
      try {
        audio.pause();
      } catch {
        // Ignore
      }
      onEnd?.();
      return;
    }

    const cue = cues[index];
    index += 1;

    try {
      audio.playbackRate = slowRate;
      audio.currentTime = cue.start;
    } catch {
      onFail?.();
      return;
    }

    const playPromise = audio.play();
    const watchEnd = () => {
      if (token !== playbackToken) return;
      if (audio.currentTime >= cue.end - 0.01 || audio.ended) {
        audio.pause();
        if (index < cues.length) {
          const pauseId = window.setTimeout(playNextCue, 180);
          activeTimers.push(pauseId);
        } else {
          onEnd?.();
        }
        return;
      }
      activeRafId = requestAnimationFrame(watchEnd);
    };

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          if (token !== playbackToken) {
            audio.pause();
            return;
          }
          if (!started) {
            started = true;
            onStart?.();
          }
          activeRafId = requestAnimationFrame(watchEnd);
        })
        .catch(() => {
          if (token === playbackToken) {
            onFail?.();
          }
        });
    } else {
      if (!started) {
        started = true;
        onStart?.();
      }
      activeRafId = requestAnimationFrame(watchEnd);
    }
  };

  playNextCue();
}

function pickBestVoice(lang: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const targetLower = lang.toLowerCase();
  const baseLang = targetLower.split('-')[0];

  const exact = voices.find((v) => v.lang.toLowerCase() === targetLower);
  if (exact) return exact;

  if (baseLang === 'en') {
    const ukVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en-gb'));
    if (ukVoice) return ukVoice;
  }

  return voices.find((v) => v.lang.toLowerCase().startsWith(baseLang)) || null;
}

function speakWithWebSpeech(
  text: string,
  lang: string,
  rate: 'normal' | 'slow',
  token: number,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (token !== playbackToken) return;

  if (!isSpeechSupported()) {
    onStart?.();
    const t = window.setTimeout(() => {
      if (token === playbackToken) onEnd?.();
    }, 450);
    activeTimers.push(t);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate === 'slow' ? 0.68 : 0.92;
    utterance.pitch = 1.05;

    const voice = pickBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
    }

    let finished = false;
    const finish = () => {
      if (!finished && token === playbackToken) {
        finished = true;
        onEnd?.();
      }
    };

    utterance.onstart = () => {
      if (token === playbackToken) onStart?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);

    const safety = window.setTimeout(finish, Math.max(2500, text.length * 140));
    activeTimers.push(safety);
  } catch {
    onEnd?.();
  }
}

export function speakText(text: string, options: SpeakOptions = {}): void {
  const { lang = 'en-GB', rate = 'normal', onStart, onEnd } = options;

  stopSpeaking();
  const token = playbackToken;

  // Priority 1: Studio ElevenLabs British English Audio Sprite (100% offline, instant)
  if (lang.toLowerCase().startsWith('en')) {
    const cues = resolveSpriteSequence(text);
    if (cues && cues.length > 0) {
      if (rate === 'slow') {
        // Use pitch-preserving HTMLAudioElement at 0.78x, with Web Audio fallback
        playSlowHtmlSequence(cues, token, onStart, onEnd, () => {
          ensureSpriteBuffer().then((buf) => {
            if (token !== playbackToken) return;
            if (buf) {
              playBufferSequence(buf, cues, 0.84, token, onStart, onEnd);
            } else {
              speakWithWebSpeech(text, lang, rate, token, onStart, onEnd);
            }
          });
        });
        return;
      }

      if (spriteBuffer) {
        playBufferSequence(spriteBuffer, cues, 1.0, token, onStart, onEnd);
        return;
      }

      ensureSpriteBuffer().then((buf) => {
        if (token !== playbackToken) return;
        if (buf) {
          playBufferSequence(buf, cues, 1.0, token, onStart, onEnd);
        } else {
          speakWithWebSpeech(text, lang, rate, token, onStart, onEnd);
        }
      });
      return;
    }
  }

  // Priority 2: Web Speech API fallback (Polish modules, custom parent modules, unmapped words)
  speakWithWebSpeech(text, lang, rate, token, onStart, onEnd);
}
