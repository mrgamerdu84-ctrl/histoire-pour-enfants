import React, { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Home,
  ListMusic,
  Moon,
  Sparkles,
  Square,
  Sun,
  Volume2,
} from "lucide-react";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { COMPTINES, CONTES } from "./library";
import "./styles.css";

export default function App() {
  const [mode, setMode] = useState("cover");
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [storyPageIdx, setStoryPageIdx] = useState(0);
  const [currentComptineIdx, setCurrentComptineIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [speechRate, setSpeechRate] = useState(0.88);
  const speechRun = useRef(0);

  const currentStory = CONTES[currentStoryIdx];
  const currentComptine = COMPTINES[currentComptineIdx];

  const cancelEngines = async () => {
    try {
      await TextToSpeech.stop();
    } catch (_) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const stopSpeak = async () => {
    speechRun.current += 1;
    await cancelEngines();
    setIsSpeaking(false);
  };

  const speakWithWebFallback = (text) =>
    new Promise((resolve, reject) => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        reject(new Error("Synthèse vocale indisponible"));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith("fr"));
      if (frenchVoice) utterance.voice = frenchVoice;
      utterance.onend = resolve;
      utterance.onerror = () => reject(new Error("Erreur de lecture vocale"));
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
        queueStrategy: 0,
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
    setIsSpeaking(true);
    try {
      for (let page = storyPageIdx; page < currentStory.pages.length; page += 1) {
        if (speechRun.current !== myRun) return;
        setStoryPageIdx(page);
        await speakText(currentStory.pages[page]);
      }
    } catch (_) {
      if (speechRun.current === myRun) {
        setVoiceError("La voix Android ne démarre pas. Installe ou active une voix française dans les réglages de synthèse vocale.");
      }
    } finally {
      if (speechRun.current === myRun) setIsSpeaking(false);
    }
  };

  const playComptine = async () => {
    const myRun = speechRun.current + 1;
    speechRun.current = myRun;
    setVoiceError("");
    await cancelEngines();
    setIsSpeaking(true);
    try {
      await speakText(currentComptine.lyrics);
    } catch (_) {
      if (speechRun.current === myRun) {
        setVoiceError("La voix Android ne démarre pas. Installe ou active une voix française dans les réglages de synthèse vocale.");
      }
    } finally {
      if (speechRun.current === myRun) setIsSpeaking(false);
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
    await stopSpeak();
    setMode("cover");
  };

  const chooseStory = async (index) => {
    await stopSpeak();
    setCurrentStoryIdx(index);
    setStoryPageIdx(0);
    setMode("contes");
    setVoiceError("");
  };

  const chooseComptine = async (index) => {
    await stopSpeak();
    setCurrentComptineIdx(index);
    setMode("comptines");
    setVoiceError("");
  };

  useEffect(() => {
    return () => {
      speechRun.current += 1;
      try { TextToSpeech.stop(); } catch (_) {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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
            <h1>Une petite bibliothèque<br />à écouter tranquillement</h1>
            <p className="heroCopy">Des contes classiques et des comptines en français, avec lecture vocale Android et mode nuit.</p>
            <div className="choiceGrid">
              <button className="choiceCard choiceCard--stories" onClick={() => chooseStory(currentStoryIdx)}>
                <span className="choiceIcon"><BookOpen size={28} /></span>
                <span><strong>Contes</strong><small>{CONTES.length} histoires · lecture complète</small></span>
                <ChevronRight size={22} />
              </button>
              <button className="choiceCard choiceCard--songs" onClick={() => chooseComptine(currentComptineIdx)}>
                <span className="choiceIcon"><ListMusic size={28} /></span>
                <span><strong>Comptines</strong><small>{COMPTINES.length} comptines · lecture audio</small></span>
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="featureRow"><span>🌙 Mode nuit</span><span>🔊 Voix française</span><span>📵 Sans compte</span></div>
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
                <button className="playButton" onClick={isSpeaking ? stopSpeak : playStory}>{isSpeaking ? <Square size={17} /> : <Volume2 size={19} />}{isSpeaking ? "Arrêter" : storyPageIdx === 0 ? "Écouter l'histoire" : "Continuer l'écoute"}</button>
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
              <div><span className="eyebrow">Petite collection musicale</span><h2>Choisis une comptine</h2></div>
              <label className="rateControl"><span>Vitesse</span><select value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))}><option value={0.75}>Douce</option><option value={0.88}>Normale</option><option value={1}>Rapide</option></select></label>
            </div>
            <div className="pickerStrip" role="list" aria-label="Liste des comptines">
              {COMPTINES.map((song, index) => <button key={song.id} className={index === currentComptineIdx ? "pickerCard pickerCard--active" : "pickerCard"} style={{ "--accent": song.accent }} onClick={() => chooseComptine(index)}><span className="pickerEmoji">♪</span><span>{song.title}</span></button>)}
            </div>
            <article className="readerCard readerCard--song" style={{ "--reader-accent": currentComptine.accent }}>
              <div className="readerGlow" />
              <div className="readerMeta"><span className="categoryPill"><ListMusic size={14} /> Comptine</span><span>{currentComptineIdx + 1} / {COMPTINES.length}</span></div>
              <div className="musicDisc" aria-hidden="true">♪</div>
              <h2>{currentComptine.title}</h2>
              <p className="songHint">La voix Android récite une courte version de la comptine.</p>
              <div className="lyrics">{currentComptine.lyrics}</div>
              <button className="playButton playButton--wide" onClick={isSpeaking ? stopSpeak : playComptine}>{isSpeaking ? <Square size={17} /> : <Headphones size={20} />}{isSpeaking ? "Arrêter" : "Écouter la comptine"}</button>
            </article>
            {voiceError && <div className="voiceAlert"><div><strong>La voix a besoin d’un réglage</strong><span>{voiceError}</span></div><button onClick={openVoiceSettings}>Configurer la voix</button></div>}
            <div className="bottomNav"><button onClick={previousComptine} disabled={currentComptineIdx === 0}><ChevronLeft size={18} /> Précédente</button><span>{currentComptineIdx + 1} / {COMPTINES.length}</span><button onClick={nextComptine} disabled={currentComptineIdx === COMPTINES.length - 1}>Suivante <ChevronRight size={18} /></button></div>
          </div>
        )}
      </section>
    </main>
  );
}
