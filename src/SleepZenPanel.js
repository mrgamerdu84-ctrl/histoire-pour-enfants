import React, { useEffect, useMemo, useState } from 'react';
import { CloudMoon, MoonStar, Sparkles, X } from 'lucide-react';

const STAR_COUNT = 10;

export default function SleepZenPanel() {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState('respire');
  const [breathIn, setBreathIn] = useState(true);
  const [starsLeft, setStarsLeft] = useState(STAR_COUNT);
  const [moonRock, setMoonRock] = useState(0);

  useEffect(() => {
    if (!open || activity !== 'respire') return undefined;
    const timer = window.setInterval(() => setBreathIn((value) => !value), breathIn ? 4000 : 6000);
    return () => window.clearInterval(timer);
  }, [open, activity, breathIn]);

  const stars = useMemo(() => Array.from({ length: STAR_COUNT }, (_, index) => index), []);

  const close = () => setOpen(false);

  return (
    <>
      <button className="sleepZenFab" type="button" onClick={() => setOpen(true)} aria-label="Ouvrir Dodo zen">
        <MoonStar size={21} />
        <span>Dodo zen</span>
      </button>

      {open && (
        <div className="sleepZenBackdrop" onClick={close} role="presentation">
          <section className="sleepZenPanel" role="dialog" aria-modal="true" aria-labelledby="sleep-zen-title" onClick={(event) => event.stopPropagation()}>
            <div className="sleepZenSky" aria-hidden="true">
              <span className="sleepZenGlow" />
              <span className="sleepZenCloud sleepZenCloud--a" />
              <span className="sleepZenCloud sleepZenCloud--b" />
            </div>

            <header className="sleepZenHeader">
              <div>
                <span className="sleepZenEyebrow">Le coin calme du soir</span>
                <h2 id="sleep-zen-title">Dodo zen 🌙</h2>
                <p>Trois petits jeux très calmes, sans score ni chrono.</p>
              </div>
              <button className="sleepZenClose" type="button" onClick={close} aria-label="Fermer"><X size={21} /></button>
            </header>

            <div className="sleepZenTabs" role="tablist" aria-label="Activités Dodo zen">
              <button className={activity === 'respire' ? 'is-active' : ''} onClick={() => setActivity('respire')}><CloudMoon size={17} /> Respirer</button>
              <button className={activity === 'etoiles' ? 'is-active' : ''} onClick={() => setActivity('etoiles')}><Sparkles size={17} /> Étoiles</button>
              <button className={activity === 'lune' ? 'is-active' : ''} onClick={() => setActivity('lune')}><MoonStar size={17} /> Bercer la lune</button>
            </div>

            {activity === 'respire' && (
              <div className="zenActivity zenBreathing">
                <div className={breathIn ? 'breathOrb breathOrb--in' : 'breathOrb breathOrb--out'}>
                  <span>☁️</span>
                </div>
                <strong>{breathIn ? 'Inspire doucement…' : 'Souffle doucement…'}</strong>
                <p>Regarde le nuage grandir puis devenir tout petit. Il n’y a rien à réussir, juste à suivre tranquillement.</p>
              </div>
            )}

            {activity === 'etoiles' && (
              <div className="zenActivity">
                <div className="starGame" aria-label="Éteins doucement les étoiles">
                  {stars.map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={star < starsLeft ? `zenStar zenStar--${star % 5}` : 'zenStar zenStar--off'}
                      onClick={() => setStarsLeft((value) => Math.max(0, value - 1))}
                      aria-label="Éteindre une étoile"
                    >★</button>
                  ))}
                </div>
                <strong>{starsLeft > 0 ? `Encore ${starsLeft} petite${starsLeft > 1 ? 's' : ''} étoile${starsLeft > 1 ? 's' : ''}` : 'Le ciel est calme ✨'}</strong>
                <p>Touche doucement les étoiles une par une. Quand elles sont toutes éteintes, tu peux les rallumer pour recommencer.</p>
                {starsLeft === 0 && <button className="zenReset" type="button" onClick={() => setStarsLeft(STAR_COUNT)}>Rallumer les étoiles</button>}
              </div>
            )}

            {activity === 'lune' && (
              <div className="zenActivity">
                <button className={`moonRock moonRock--${moonRock % 3}`} type="button" onClick={() => setMoonRock((value) => value + 1)} aria-label="Bercer doucement la lune">
                  <span className="moonFace">🌙</span>
                  <span className="moonCloud">☁️</span>
                </button>
                <strong>Bercer la lune</strong>
                <p>Appuie doucement sur la lune pour la faire se balancer sur son nuage. Elle revient toujours lentement au milieu.</p>
              </div>
            )}

            <div className="sleepZenNote">🌜 Astuce du soir : baisse la luminosité de l’écran et garde le son très doux.</div>
          </section>
        </div>
      )}
    </>
  );
}
