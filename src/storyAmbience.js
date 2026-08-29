import "./audioStyles.css";

let audioContext = null;
let masterGain = null;
let activeNodes = [];
let timers = [];

const AudioCtx = () => window.AudioContext || window.webkitAudioContext;

const PRESETS = {
  magic: { label: "Boîte à musique magique", bpm: 76, melody: [72,76,79,83,79,76,74,79,76,72,67,71,74,79,76,72], bass: [48,55,52,55] },
  forest: { label: "Promenade en forêt", bpm: 68, melody: [67,71,74,71,69,72,76,72,67,71,74,79,76,72,71,67], bass: [43,50,47,50] },
  dream: { label: "Rêve étoilé", bpm: 62, melody: [69,73,76,81,76,73,71,76,73,69,64,68,71,76,73,69], bass: [45,52,49,52] },
  adventure: { label: "Petite aventure", bpm: 82, melody: [65,69,72,77,72,69,67,72,69,65,60,64,67,72,69,65], bass: [41,48,45,48] },
  night: { label: "Nuit calme", bpm: 58, melody: [64,67,71,76,71,67,66,71,67,64,59,62,66,71,67,64], bass: [40,47,43,47] },
};

export function getStoryMood(story) {
  const value = `${story?.id || ""} ${story?.title || ""}`.toLowerCase();
  if (/(blanche|forêt|bois|loup|cochon|chaperon|chèvre|chevre)/.test(value)) return "forest";
  if (/(dormant|dormante|nuit|lune|étoile|etoile)/.test(value)) return "dream";
  if (/(cendrillon|fée|fee|belle|prince|princesse)/.test(value)) return "magic";
  if (/(chat|botte|poucet|voyage|aventure|haricot)/.test(value)) return "adventure";
  return "night";
}

export function getMoodLabel(story) { return PRESETS[getStoryMood(story)]?.label || "Mélodie douce"; }
function midiToFrequency(note) { return 440 * Math.pow(2, (note - 69) / 12); }
function remember(node) { activeNodes.push(node); return node; }

function outputLevel(volume) {
  // Fond musical volontairement un peu plus présent, tout en restant sous la narration.
  return Math.max(0.36, Math.min(0.72, Number(volume || 0.11) * 4.25));
}

function connectWithPan(ctx, source, destination, panValue) {
  if (typeof ctx.createStereoPanner === "function") {
    const panner = remember(ctx.createStereoPanner());
    panner.pan.value = panValue;
    source.connect(panner);
    panner.connect(destination);
  } else source.connect(destination);
}

function playMusicBoxNote(ctx, destination, midiNote, velocity = 1, pan = 0) {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const frequency = midiToFrequency(midiNote);
  const noteGain = remember(ctx.createGain());
  const filter = remember(ctx.createBiquadFilter());
  const fundamental = remember(ctx.createOscillator());
  const shimmer = remember(ctx.createOscillator());
  const shimmerGain = remember(ctx.createGain());
  fundamental.type = "sine"; fundamental.frequency.setValueAtTime(frequency, now);
  shimmer.type = "sine"; shimmer.frequency.setValueAtTime(frequency * 2.01, now);
  filter.type = "lowpass"; filter.frequency.value = 3200; filter.Q.value = 0.4;
  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.exponentialRampToValueAtTime(0.11 * velocity, now + 0.025);
  noteGain.gain.exponentialRampToValueAtTime(0.026 * velocity, now + 0.45);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
  shimmerGain.gain.value = 0.23;
  fundamental.connect(filter); shimmer.connect(shimmerGain); shimmerGain.connect(filter); filter.connect(noteGain);
  connectWithPan(ctx, noteGain, destination, pan);
  fundamental.start(now); shimmer.start(now); fundamental.stop(now + 1.75); shimmer.stop(now + 1.75);
}

function playSoftBass(ctx, destination, midiNote) {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const oscillator = remember(ctx.createOscillator()); const gain = remember(ctx.createGain()); const filter = remember(ctx.createBiquadFilter());
  oscillator.type = "triangle"; oscillator.frequency.value = midiToFrequency(midiNote);
  filter.type = "lowpass"; filter.frequency.value = 540;
  gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.032, now + 0.08); gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
  oscillator.connect(filter); filter.connect(gain); gain.connect(destination); oscillator.start(now); oscillator.stop(now + 2.25);
}

function startMusicalLoop(ctx, destination, preset) {
  const beatMs = 60000 / preset.bpm; let step = 0;
  const playStep = () => {
    if (!audioContext || audioContext.state !== "running") return;
    const note = preset.melody[step % preset.melody.length]; const pan = step % 2 === 0 ? -0.12 : 0.12;
    playMusicBoxNote(ctx, destination, note, step % 4 === 0 ? 1 : 0.82, pan);
    if (step % 4 === 0) playSoftBass(ctx, destination, preset.bass[Math.floor(step / 4) % preset.bass.length]);
    step = (step + 1) % preset.melody.length;
  };
  playStep(); timers.push(window.setInterval(playStep, beatMs));
}

export async function startStoryAmbience(story, volume = 0.11) {
  await stopStoryAmbience(); const Ctx = AudioCtx(); if (!Ctx) return false;
  const preset = PRESETS[getStoryMood(story)] || PRESETS.night; audioContext = new Ctx();
  if (audioContext.state === "suspended") await audioContext.resume(); if (audioContext.state !== "running") return false;
  const compressor = remember(audioContext.createDynamicsCompressor());
  compressor.threshold.value = -18; compressor.knee.value = 18; compressor.ratio.value = 3; compressor.attack.value = 0.01; compressor.release.value = 0.35; compressor.connect(audioContext.destination);
  masterGain = audioContext.createGain(); masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime); masterGain.gain.linearRampToValueAtTime(outputLevel(volume), audioContext.currentTime + 0.35); masterGain.connect(compressor);
  startMusicalLoop(audioContext, masterGain, preset); return true;
}

export function setStoryAmbienceVolume(volume) {
  if (!masterGain || !audioContext || audioContext.state === "closed") return;
  const target = outputLevel(volume); masterGain.gain.cancelScheduledValues(audioContext.currentTime); masterGain.gain.linearRampToValueAtTime(target, audioContext.currentTime + 0.2);
}

export async function stopStoryAmbience() {
  timers.forEach((timer) => window.clearInterval(timer)); timers = [];
  if (masterGain && audioContext && audioContext.state !== "closed") {
    try { const now = audioContext.currentTime; masterGain.gain.cancelScheduledValues(now); masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now); masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.16); await new Promise((resolve) => window.setTimeout(resolve, 170)); } catch (_) {}
  }
  activeNodes.forEach((node) => { try { if (typeof node.stop === "function") node.stop(); } catch (_) {} try { node.disconnect(); } catch (_) {} }); activeNodes = [];
  if (masterGain) { try { masterGain.disconnect(); } catch (_) {} masterGain = null; }
  if (audioContext) { try { await audioContext.close(); } catch (_) {} audioContext = null; }
}
