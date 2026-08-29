import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Home,
  ListMusic,
  Moon,
  Music2,
  Sparkles,
  Square,
  Sun,
  Volume2,
  Waves,
} from "lucide-react";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { COMPTINES, CONTES } from "./library";
import {
  getMoodLabel,
  setStoryAmbienceVolume,
  startStoryAmbience,
  stopStoryAmbience,
} from "./storyAmbience";
import { playSongMelody, stopSongMelody } from "./songPlayer";
import "./styles.css";

export default function App() {
  const [mode, setMode] = useState("cover");
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [storyPageIdx, setStoryPageIdx] = useState(0);
  const [currentComptineIdx, setCurrentComptineIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [songError, setSongError] = useState("");
  const [speechRate, setSpeechRate] = useState(0.88);
  const [ambienceEnabled, setAmbienceEnabled] = useState(true);
  const [ambienceVolume, setAmbienceVolume] = useState(0.14);
  const speechRun = useRef(0);
  const webUtteranceRef = useRef(null);

  const currentStory = CONTES[currentStoryIdx];
  const currentComptine = COMPTINES[currentComptineIdx];

  const cancelEngines = async () => {
    try {
      await TextToSpeech.stop();
    } catch (_) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    webUtteranceRef.current = null;
  };

  const stopSong = async () => {
    await stopSongMelody();
    setIsSongPlaying(false);
  };

  const stopSpeak = async () => {
    speechRun.current += 1;
    await cancelEngines();
    await stopStoryAmbience();
    setIsSpeaking(false);
  };

  const stopAllAudio = async () => {
    await stopSpeak();
    await stopSong();
  };

  const speakWithWebFallback = (text) =>
    new Promise((resolve, reject) => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        reject(new Error("Synthèse vocale indisponible"));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      webUtteranceRef.current = utterance;
      utterance.lang = "fr-FR";
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const frenchVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("fr"));
      const frenchVoice = frenchVoices.find((voice) => voice.localService) || frenchVoices[0];
      if (frenchVoice) utterance.voice = frenchVoice;
      utterance.onend = () => {
        if (webUtteranceRef.current === utterance) webUtteranceRef.current = null;
        resolve();
      };
      utterance.onerror = () => {
        if (webUtteranceRef.current === utterance) webUtteranceRef.current = null;
        reject(new Error("Erreur de lecture vocale"));
      };
      window.speechSynthesis.speak(utterance);
    });

  const speakText = async (text) => {
    try {
      await TextToSpeech.speak({
        text,
        lang: "fr-FR",
        rate: speechRate,
        pitch: 1,
        volume: 1,
        queueStrategy: 1,
      });
    } catch (_) {
      await speakWithWebFallback(text);
    }
  };

  const playStory = async () => {
    const myRun = speechRun.current + 1;
    speechRun.current = myRun;
    setVoiceError("");
    await cancelEngines();
    await stopSong();
    await stopStoryAmbience();
    setIsSpeaking(true);

    try {
      if (ambienceEnabled) {
        await startStoryAmbience(currentStory, ambienceVolume);
      }

      for (let page = storyPageIdx; page < currentStory.pages.length; page += 1) {
        if (speechRun.current !== myRun) return;
        setStoryPageIdx(page);
        await speakText(currentStory.pages[page]);
        if (speechRun.current !== myRun) return;
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
    } catch (_) {
      if (speechRun.current === myRun) {
        setVoiceError("La voix Android ne démarre pas. Installe ou active une voix française dans les réglages de synthèse vocale.");
      }
    } finally {
      await stopStoryAmbience();
      if (speechRun.current === myRun) setIsSpeaking(false);
    }
  };

  const playComptine = async () => {
    setSongError("");
    await stopSpeak();
    await stopSong();

    if (!currentComptine?.melody?.length) {
      setSongError("Cette musique n'est pas encore prête.");
      return;
    }

    try {
      setIsSongPlaying(true);
      await playSongMelody(currentComptine, () => setIsSongPlaying(false));
    } catch (_) {
      await stopSongMelody();
      setIsSongPlaying(false);
      setSongError("La musique n'a pas pu démarrer. Réessaie en appuyant une seconde fois sur Écouter.");
    }
  };

  const openVoiceSettings = async () => {
    try {
      await TextToSpeech.openInstall();
    } catch (_) {
      setVoiceError("Ouvre les réglages Android > Synthèse vocale et vérifie qu'une voix française est installée.");
    }
  };

  const goHome = async () => {
    await stopAllAudio();
    setMode("cover");
  };

  const chooseStory = async (index) => {
    await stopAllAudio();
    setCurrentStoryIdx(index);
    setStoryPageIdx(0);
    setMode("contes");
    setVoiceError("");
    setSongError("");
  };

  const chooseComptine = async (index) => {
    await stopAllAudio();
    setCurrentComptineIdx(index);
    setMode("comptines");
    setVoiceError("");
    setSongError("");
  };

  useEffect(() => {
    setStoryAmbienceVolume(ambienceVolume);
  }, [ambienceVolume]);

  useEffect(() => {
    return () => {
      speechRun.current += 1;
      try { TextToSpeech.stop(); } catch (_) {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      webUtteranceRef.current = null;
      stopSongMelody();
      stopStoryAmbience();
    };
  }, []);

  const previousStory = async () => {
    if (currentStoryIdx > 0) await chooseStory(currentStoryIdx - 1);
  };
  const nextStory = async () => {
    if (currentStoryIdx < CONTES.length - 1) await chooseStory(currentStoryIdx + 1);
  };
  const previousComptine = async () => {
    if (currentComptineIdx > 0) await chooseComptine(currentComptineIdx - 1);
  };
  const nextComptine = async () => {
    if (currentComptineIdx < COMPTINES.length - 1) await chooseComptine(currentComptineIdx + 1);
  };

  return (
    <main className={nightMode ? "app app--night" : "app"}>
      <div className="aurora aurora--one" />
      <div className="aurora aurora--two" />
      <section className="shell">
        <header className="topbar">
          <button className="iconButton" onClick={goHome} aria-label="Accueil"><Home size={20} /></button>
          <div className="brand"><span className="brandMark"><Sparkles size={16} /></span><span>Histoires & Comptines</span></div>
          <button className="iconButton" onClick={() => setNightMode((value) => !value)} aria-label="Mode nuit">
            {nightMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {mode === "cover" && (
          <div className="coverView">
            <div className="heroBadge"><Headphones size={16} /> Le coin calme du soir</div>
            <div className="heroIcon" aria-hidden="true">📖</div>
            <h1>Des histoires à écouter,<br />des comptines à chanter</h1>
            <p className="heroCopy">Les histoires ont une ambiance musicale pendant la narration. Les comptines jouent maintenant leurs mélodies directement dans l'application, même sans Internet, avec les paroles affichées.</p>
            <div className="choiceGrid">
              <button className="choiceCard choiceCard--stories" onClick={() => chooseStory(currentStoryIdx)}>
                <span className="choiceIcon"><BookOpen size={28} /></span>
                <span><strong>Contes</strong><small>{CONTES.length} histoires · narration + fond musical</small></span>
                <ChevronRight size={22} />
              </button>
              <button className="choiceCard choiceCard--songs" onClick={() => chooseComptine(currentComptineIdx)}>
                <span className="choiceIcon"><ListMusic size={28} /></span>
                <span><strong>Comptines</strong><small>{COMPTINES.length} titres · musique hors ligne + paroles</small></span>
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="featureRow"><span>🌙 Mode nuit</span><span>🎵 Musique hors ligne</span><span>📝 Paroles affichées</span></div>
          </div>
        )}

        {mode === "contes" && currentStory && (
          <div className="libraryView">
            <div className="sectionHeading">
              <div><span className="eyebrow">Bibliothèque des contes</span><h2>Choisis une histoire</h2></div>
              <label className="rateControl"><span>Vitesse</span><select value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))}><option value={0.75}>Douce</option><option value={0.88}>Normale</option><option value={1}>Rapide</option></select></label>
            </div>
            <div className="pickerStrip" role="list" aria-label="Liste des contes">
              {CONTES.map((story, index) => (
                <button key={story.id} className={index === currentStoryIdx ? "pickerCard pickerCard--active" : "pickerCard"} style={{ "--accent": story.accent }} onClick={() => chooseStory(index)}>
                  <span className="pickerEmoji">✦</span><span>{story.title}</span>
                </button>
              ))}
            </div>

            <div className="ambiencePanel">
              <div className="ambienceInfo">
                <span className="ambienceIcon"><Waves size={18} /></span>
                <div><strong>Fond musical : {getMoodLabel(currentStory)}</strong><small>Le fond reste audible sous la narration et tu peux régler son volume.</small></div>
              </div>
              <label className="ambienceSwitch">
                <input type="checkbox" checked={ambienceEnabled} onChange={(e) => setAmbienceEnabled(e.target.checked)} />
                <span>{ambienceEnabled ? "Activé" : "Coupé"}</span>
              </label>
              <label className="ambienceVolume">
                <span>Volume</span>
                <input type="range" min="0.06" max="0.24" step="0.01" value={ambienceVolume} disabled={!ambienceEnabled} onChange={(e) => setAmbienceVolume(Number(e.target.value))} />
              </label>
            </div>

            <article className="readerCard" style={{ "--reader-accent": currentStory.accent }}>
              <div className="readerGlow" />
              <div className="readerMeta"><span className="categoryPill"><BookOpen size={14} /> Conte</span><span>Page {storyPageIdx + 1} / {currentStory.pages.length}</span></div>
              <h2>{currentStory.title}</h2>
              <p className="origin">{currentStory.origin}</p>
              <div className="pageDots" aria-label="Progression de l'histoire">
                {currentStory.pages.map((_, index) => <button key={index} className={index === storyPageIdx ? "pageDot pageDot--active" : "pageDot"} onClick={async () => { await stopSpeak(); setStoryPageIdx(index); }} aria-label={`Page ${index + 1}`} />)}
              </div>
              <div className="storyText">{currentStory.pages[storyPageIdx]}</div>
              <div className="readerControls">
                <button className="roundControl" disabled={storyPageIdx === 0} onClick={async () => { await stopSpeak(); setStoryPageIdx((page) => Math.max(0, page - 1)); }} aria-label="Page précédente"><ChevronLeft size={22} /></button>
                <button className="playButton" onClick={isSpeaking ? stopSpeak : playStory}>{isSpeaking ? <Square size={17} /> : <Volume2 size={19} />}{isSpeaking ? "Arrêter" : storyPageIdx === 0 ? "Écouter avec ambiance" : "Continuer avec ambiance"}</button>
                <button className="roundControl" disabled={storyPageIdx >= currentStory.pages.length - 1} onClick={async () => { await stopSpeak(); setStoryPageIdx((page) => Math.min(currentStory.pages.length - 1, page + 1)); }} aria-label="Page suivante"><ChevronRight size={22} /></button>
              </div>
            </article>
            {voiceError && <div className="voiceAlert"><div><strong>La voix a besoin d’un réglage</strong><span>{voiceError}</span></div><button onClick={openVoiceSettings}>Configurer la voix</button></div>}
            <div className="bottomNav"><button onClick={previousStory} disabled={currentStoryIdx === 0}><ChevronLeft size={18} /> Histoire précédente</button><span>{currentStoryIdx + 1} / {CONTES.length}</span><button onClick={nextStory} disabled={currentStoryIdx === CONTES.length - 1}>Histoire suivante <ChevronRight size={18} /></button></div>
          </div>
        )}

        {mode === "comptines" && currentComptine && (
          <div className="libraryView">
            <div className="sectionHeading">
              <div><span className="eyebrow">Petite collection musicale</span><h2>Choisis une chanson</h2></div>
              <span className="sungOnlyBadge"><Music2 size={15} /> Musique + paroles</span>
            </div>
            <div className="pickerStrip" role="list" aria-label="Liste des comptines">
              {COMPTINES.map((song, index) => <button key={song.id} className={index === currentComptineIdx ? "pickerCard pickerCard--active" : "pickerCard"} style={{ "--accent": song.accent }} onClick={() => chooseComptine(index)}><span className="pickerEmoji">♪</span><span>{song.title}</span></button>)}
            </div>
            <article className="readerCard readerCard--song" style={{ "--reader-accent": currentComptine.accent }}>
              <div className="readerGlow" />
              <div className="readerMeta"><span className="categoryPill"><ListMusic size={14} /> Comptine</span><span>{currentComptineIdx + 1} / {COMPTINES.length}</span></div>
              <div className={isSongPlaying ? "musicDisc musicDisc--playing" : "musicDisc"} aria-hidden="true">♪</div>
              <h2>{currentComptine.title}</h2>
              <p className="songHint">{currentComptine.description}</p>

              <div className="songSourceCard">
                <strong>🎵 Musique intégrée</strong>
                <span>{currentComptine.source}</span>
                <small>{currentComptine.license} · aucune connexion nécessaire.</small>
              </div>

              <div className="lyricsCard">
                <strong>Paroles</strong>
                <div className="lyricsLines">
                  {(currentComptine.lyrics || []).map((line, index) => <p key={`${currentComptine.id}-${index}`}>{line}</p>)}
                </div>
              </div>

              <button className="playButton playButton--wide" onClick={isSongPlaying ? stopSong : playComptine} disabled={!currentComptine.melody?.length}>{isSongPlaying ? <Square size={17} /> : <Headphones size={20} />}{isSongPlaying ? "Arrêter la musique" : "Écouter la musique"}</button>
            </article>
            {songError && <div className="voiceAlert"><div><strong>Lecture musicale</strong><span>{songError}</span></div></div>}
            <div className="bottomNav"><button onClick={previousComptine} disabled={currentComptineIdx === 0}><ChevronLeft size={18} /> Précédente</button><span>{currentComptineIdx + 1} / {COMPTINES.length}</span><button onClick={nextComptine} disabled={currentComptineIdx === COMPTINES.length - 1}>Suivante <ChevronRight size={18} /></button></div>
          </div>
        )}
      </section>
    </main>
  );
}
