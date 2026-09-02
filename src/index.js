import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './designEnhancements.css';
import './lyricsStyles.css';
import './launchSplash.css';

function RootApp() {
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLaunchSplash(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {showLaunchSplash && (
        <div className="launchSplash" aria-label="Écran de démarrage Histoires & Comptines">
          <img src={`${process.env.PUBLIC_URL}/branding/splash.svg`} alt="Histoires & Comptines" />
        </div>
      )}
      <App />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
