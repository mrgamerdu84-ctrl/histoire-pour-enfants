import React, { useState } from 'react';

export default function PrivacyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="privacyLink" type="button" onClick={() => setOpen(true)}>
        Politique de confidentialité
      </button>

      {open && (
        <div className="privacyBackdrop" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="privacyModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="privacyHeader">
              <div>
                <span className="privacyEyebrow">tikowikoFamily</span>
                <h2 id="privacy-title">Politique de confidentialité</h2>
              </div>
              <button className="privacyClose" type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                ×
              </button>
            </div>

            <div className="privacyBody">
              <p><strong>Dernière mise à jour : 3 septembre 2026.</strong></p>

              <h3>Données personnelles</h3>
              <p>
                Histoires & Comptines ne demande pas de compte et ne collecte pas directement votre nom,
                votre localisation, vos contacts, vos photos, votre microphone ou d’autres données personnelles.
              </p>

              <h3>Histoires, comptines et audio</h3>
              <p>
                Les histoires, les paroles et les mélodies intégrées sont utilisées localement dans l’application.
                La lecture vocale des histoires utilise le moteur de synthèse vocale configuré sur votre appareil.
                Selon le moteur choisi sur Android, son fournisseur peut appliquer sa propre politique de confidentialité.
              </p>

              <h3>Publicité et analyse</h3>
              <p>
                L’application ne contient actuellement ni publicité intégrée ni outil d’analyse destiné à suivre votre utilisation.
                tikowikoFamily ne vend pas vos données personnelles.
              </p>

              <h3>Contact</h3>
              <p>
                Si vous écrivez à tikowikoFamily, votre adresse e-mail et le contenu de votre message sont utilisés uniquement
                pour vous répondre et traiter votre demande. Si vous êtes mineur, demandez l’accord d’un parent ou d’un responsable
                avant d’envoyer des informations personnelles par e-mail.
              </p>

              <a className="privacyEmail" href="mailto:mrgamerdu84@gmail.com">mrgamerdu84@gmail.com</a>
            </div>

            <button className="privacyDone" type="button" onClick={() => setOpen(false)}>Fermer</button>
          </section>
        </div>
      )}
    </>
  );
}
