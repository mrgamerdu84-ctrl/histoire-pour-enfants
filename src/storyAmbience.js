import "./audioStyles.css";

let audioContext = null;
let masterGain = null;
let activeNodes = [];
let timers = [];

const AudioCtx = () => window.AudioContext || window.webkitAudioContext;

const PRESETS = {
  magic: {
    label: "Magique",
    pad: [261.63, 329.63, 392.0],
    melody: [523.25, 659.25, 783.99, 659.25],
    interval: 3000,
    waveform: "sine",
  },
  forest: {
    label: "Forêt",
    pad: [196.0, 246.94, 293.66],
    melody: [392.0, 440.0, 493.88, 440.0],
    interval: 3600,
    waveform: "sine",
  },
  dream: {
    label: "Rêve",
    pad: [220.0, 277.18, 329.63],
    melody: [440.0, 554.37, 659.25, 554.37],
    interval: 4200,
    waveform: "sine",
  },
  adventure: {
    label: "Aventure douce",
    pad: [174.61, 220.0, 261.63],
    melody: [349.23, 440.0, 523.25, 440.0],
    interval: 2600,
    waveform: "triangle",
  },
  night: {
    label: "Nuit calme",
    pad: [146.83, 196.0, 220.0],
    melody: [293.66, 392.0, 440.0, 392.0],
    interval: 4800,
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

function outputLevel(volume) {
  // L'ancienne version multipliait deux gains très faibles et devenait presque inaudible.
  // Le curseur de l'UI reste doux, mais on le convertit ici vers un niveau réellement audible.
  return Math.max(0.16, Math.min(0.52, Number(volume || 0.11) * 3.2));
}

function createPad(ctx, destination, preset) {
  preset.pad.forEach((frequency, index) => {
    const oscillator = remember(ctx.createOscillator());
    const gain = remember(ctx.createGain());
    const filter = remember(ctx.createBiquadFilter());

    oscillator.type = preset.waveform;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 1 ? -4 : index === 2 ? 4 : 0;

    filter.type = "lowpass";
    filter.frequency.value = 760;
    filter.Q.value = 0.35;

    gain.gain.value = index === 0 ? 0.12 : index === 1 ? 0.085 : 0.065;
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start();
  });
}

function playSoftNote(ctx, destination, frequency) {
  if (!ctx || ctx.state === "closed") return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  filter.type = "lowpass";
  filter.frequency.value = 1650;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.095, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 1.9);
}

function startMelody(ctx, destination, preset) {
  let noteIndex = 0;
  playSoftNote(ctx, destination, preset.melody[noteIndex]);
  const timer = window.setInterval(() => {
    noteIndex = (noteIndex + 1) % preset.melody.length;
    playSoftNote(ctx, destination, preset.melody[noteIndex]);
  }, preset.interval);
  timers.push(timer);
}

export async function startStoryAmbience(story, volume = 0.11) {
  await stopStoryAmbience();
  const Ctx = AudioCtx();
  if (!Ctx) return false;

  const preset = PRESETS[getStoryMood(story)] || PRESETS.night;
  audioContext = new Ctx();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  if (audioContext.state !== "running") return false;

  const compressor = remember(audioContext.createDynamicsCompressor());
  compressor.threshold.value = -24;
  compressor.knee.value = 16;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.25;
  compressor.connect(audioContext.destination);

  masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(outputLevel(volume), audioContext.currentTime + 0.45);
  masterGain.connect(compressor);

  createPad(audioContext, masterGain, preset);
  startMelody(audioContext, masterGain, preset);
  return true;
}

export function setStoryAmbienceVolume(volume) {
  if (!masterGain || !audioContext || audioContext.state === "closed") return;
  const target = outputLevel(volume);
  masterGain.gain.cancelScheduledValues(audioContext.currentTime);
  masterGain.gain.linearRampToValueAtTime(target, audioContext.currentTime + 0.2);
}

export async function stopStoryAmbience() {
  timers.forEach((timer) => window.clearInterval(timer));
  timers = [];

  if (masterGain && audioContext && audioContext.state !== "closed") {
    try {
      const now = audioContext.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
      await new Promise((resolve) => window.setTimeout(resolve, 190));
    } catch (_) {}
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
