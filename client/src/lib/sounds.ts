// Kleine Soundeffekte über die Web Audio API — keine Assets, keine Dependencies.

const MUTE_KEY = "rb_sound_muted";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(
  freq: number,
  startSec: number,
  durSec: number,
  type: OscillatorType = "sine",
  gain = 0.12,
) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const t0 = ac.currentTime + startSec;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durSec);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.05);
}

export function playCorrect() {
  if (isMuted()) return;
  tone(523.25, 0, 0.12, "triangle");
  tone(783.99, 0.1, 0.2, "triangle");
}

export function playWrong() {
  if (isMuted()) return;
  tone(196, 0, 0.28, "sawtooth", 0.06);
}

export function playFanfare() {
  if (isMuted()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.13, 0.3, "triangle"));
  tone(1046.5, 0.55, 0.5, "triangle", 0.1);
}

export function playPop() {
  if (isMuted()) return;
  tone(880, 0, 0.06, "sine", 0.05);
}
