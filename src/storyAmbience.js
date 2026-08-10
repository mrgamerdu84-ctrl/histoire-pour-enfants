import "./audioStyles.css";

let audioContext = null;
let masterGain = null;
let activeNodes = [];
let chimeTimer = null;

const AudioCtx = () => window.AudioContext || window.webkitAudioContext;

const PRESETS = {
  magic: {
    label: "Magique",
    pad: [261.63, 329.63, 392.0],
    chimes: [523.25, 659.25, 783.99],
    interval: 6200,
    waveform: "sine",
  },
  forest: {
    label: "Forêt",
    pad: [196.0, 246.94, 293.66],
    chimes: [392.0, 440.0, 493.88],
    interval: 7200,
    waveform: "sine",
  },
  dream: {
    label: "Rêve",
    pad: [220.0, 277.18, 329.63],
    chimes: [440.0, 554.37, 659.25],
    interval: 8000,
    waveform: "sine",
  },
  adventure: {
    label: "Aventure douce",
    pad: [174.61, 220.0, 261.63],
    chimes: [349.23, 440.0, 523.25],
    interval: 5200,
    waveform: "triangle",
  },
  night: {
    label: "Nuit calme",
    pad: [146.83, 196.0, 220.0],
    chimes: [293.66, 392.0, 440.0],
    interval: 9000,
    waveform: "sine",
  },
};

export function getStoryMood(story) {
  const value = `${story?.id || ""} ${story?.title || ""}`.toLowerCase();
  if (/(blanche|forêt|bois|loup|chaperon|chèvre|chevre)/.test(value)) return "forest";
  if (/(dormant|dormante|nuit|lune|étoile|etoile)/.test(value)) return "dream";
  if (/(cendrillon|fée|fee|belle|prince|princesse)/.test(value)) return "magic";
  if (/(chat|botte|poucet|voyage|aventure|haricot)/.test(value)) return "adventure";
  return "night";
}

export function getMoodLabel(story) {
  return PRESETS[getStoryMood(story)]?.label || "Ambiance douce";
}

function remember(node) {
  activeNodes.push(node);
  return node;
}

function createPad(ctx, destination, preset) {
  preset.pad.forEach((frequency, index) => {
    const oscillator = remember(ctx.createOscillator());
    const gain = remember(ctx.createGain());
    const filter = remember(ctx.createBiquadFilter());

    oscillator.type = preset.waveform;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 1 ? -5 : index === 2 ? 5 : 0;

    filter.type = "lowpass";
    filter.frequency.value = 820;
    filter.Q.value = 0.4;

    gain.gain.value = 0.018 / (index + 1);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start();
  });
}

function playChime(ctx, destination, preset) {
  if (!ctx || ctx.state === "closed") return;
  const frequency = preset.chimes[Math.floor(Math.random() * preset.chimes.length)];
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.998, now + 2.2);
  filter.type = "lowpass";
  filter.frequency.value = 1500;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 2.5);
}

export async function startStoryAmbience(story, volume = 0.12) {
  await stopStoryAmbience();
  const Ctx = AudioCtx();
  if (!Ctx) return false;

  const preset = PRESETS[getStoryMood(story)] || PRESETS.night;
  audioContext = new Ctx();
  if (audioContext.state === "suspended") await audioContext.resume();

  masterGain = audioContext.createGain();
  masterGain.gain.value = Math.max(0, Math.min(0.22, volume));
  masterGain.connect(audioContext.destination);

  createPad(audioContext, masterGain, preset);
  playChime(audioContext, masterGain, preset);
  chimeTimer = window.setInterval(() => playChime(audioContext, masterGain, preset), preset.interval);
  return true;
}

export function setStoryAmbienceVolume(volume) {
  if (!masterGain || !audioContext) return;
  const target = Math.max(0, Math.min(0.22, volume));
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(target, audioContext.currentTime + 0.25);
}

export async function stopStoryAmbience() {
  if (chimeTimer) {
    window.clearInterval(chimeTimer);
    chimeTimer = null;
  }

  activeNodes.forEach((node) => {
    try { if (typeof node.stop === "function") node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  activeNodes = [];

  if (masterGain) {
    try { masterGain.disconnect(); } catch (_) {}
    masterGain = null;
  }

  if (audioContext) {
    try { await audioContext.close(); } catch (_) {}
    audioContext = null;
  }
}
