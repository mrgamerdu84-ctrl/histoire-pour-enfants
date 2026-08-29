let audioContext = null;
let endTimer = null;
let activeNodes = [];

const AudioCtx = () => window.AudioContext || window.webkitAudioContext;

const NOTE_OFFSETS = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4,
  F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10, B: 11,
};

function noteToFrequency(note) {
  if (!note || note === "R") return 0;
  const match = /^([A-G](?:#|b)?)(\d)$/.exec(note);
  if (!match) return 0;
  const [, name, octaveText] = match;
  const midi = 12 * (Number(octaveText) + 1) + NOTE_OFFSETS[name];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function remember(node) {
  activeNodes.push(node);
  return node;
}

function scheduleNote(ctx, destination, note, startAt, duration) {
  const frequency = noteToFrequency(note);
  if (!frequency) return;

  const gain = remember(ctx.createGain());
  const oscillator = remember(ctx.createOscillator());
  const shimmer = remember(ctx.createOscillator());
  const shimmerGain = remember(ctx.createGain());

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(frequency * 2.01, startAt);
  shimmerGain.gain.value = 0.16;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.055, startAt + Math.min(0.32, duration * 0.45));
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(0.08, duration - 0.025));

  oscillator.connect(gain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(gain);
  gain.connect(destination);

  oscillator.start(startAt);
  shimmer.start(startAt);
  oscillator.stop(startAt + duration);
  shimmer.stop(startAt + duration);
}

export async function stopSongMelody() {
  if (endTimer) {
    window.clearTimeout(endTimer);
    endTimer = null;
  }
  activeNodes.forEach((node) => {
    try { if (typeof node.stop === "function") node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  activeNodes = [];
  if (audioContext) {
    try { await audioContext.close(); } catch (_) {}
    audioContext = null;
  }
}

export async function playSongMelody(song, onEnded) {
  await stopSongMelody();
  const Ctx = AudioCtx();
  if (!Ctx || !song?.melody?.length) throw new Error("Lecteur musical indisponible");

  audioContext = new Ctx();
  if (audioContext.state === "suspended") await audioContext.resume();
  if (audioContext.state !== "running") throw new Error("Audio bloqué");

  const master = remember(audioContext.createGain());
  const compressor = remember(audioContext.createDynamicsCompressor());
  master.gain.value = 0.72;
  compressor.threshold.value = -14;
  compressor.knee.value = 20;
  compressor.ratio.value = 2.5;
  master.connect(compressor);
  compressor.connect(audioContext.destination);

  const beatSeconds = 60 / Number(song.bpm || 104);
  let cursor = audioContext.currentTime + 0.07;

  song.melody.forEach(([note, beats]) => {
    const duration = beatSeconds * Number(beats || 1);
    scheduleNote(audioContext, master, note, cursor, Math.max(0.09, duration * 0.92));
    cursor += duration;
  });

  const totalMs = Math.max(150, (cursor - audioContext.currentTime) * 1000 + 120);
  endTimer = window.setTimeout(async () => {
    endTimer = null;
    await stopSongMelody();
    if (typeof onEnded === "function") onEnded();
  }, totalMs);

  return true;
}
