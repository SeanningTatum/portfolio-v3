/**
 * Synthesized console SFX — key clacks while the CRT types, a laser zap
 * when a portal charges. Pure WebAudio oscillators/noise (no asset fetch);
 * the ambient loop stays `SoundToggle`'s mp3. Everything is gated behind
 * the sound toggle and no-ops when WebAudio is unavailable (SSR, tests,
 * old browsers).
 *
 * Module-level singleton on purpose: the toggle (DOM) and the scene (R3F
 * frame loop) live in different trees and must share one switch without
 * re-rendering the canvas.
 */

let enabled = false;
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** Flip from the SoundToggle click — a user gesture, so the ctx may start. */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (on) ensureCtx()?.resume();
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined")
    return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ac.sampleRate * 0.04);
  noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/**
 * Minimum seconds between clacks for a given typing speed — real keyboards
 * max out around 12 strokes/s; above that the clatter becomes one buzz.
 * Pure — unit-tested.
 */
export function clackGapS(cps: number): number {
  return 1 / Math.min(12, Math.max(1, cps));
}

/** One keyboard clack — filtered noise burst with a little pitch variance. */
export function clack(): void {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac || ac.state !== "running") return;
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2200 + Math.random() * 1600;
  band.Q.value = 1.2;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  src.connect(band).connect(gain).connect(ac.destination);
  src.start();
}

/** Laser zap — a fast downward sweep, fired on a portal hover's rising edge. */
export function zap(): void {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac || ac.state !== "running") return;
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.14);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 2400;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.07, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.16);
  osc.connect(low).connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.18);
}
