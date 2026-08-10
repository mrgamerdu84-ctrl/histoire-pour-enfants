# Histoires & Comptines

Application Android de contes et comptines en français, pensée pour une écoute calme sur mobile.

## Audio

### Histoires

- narration Android native via `@capacitor-community/text-to-speech`
- lecture continue page par page
- fond musical très léger généré directement dans l’application avec Web Audio
- ambiances automatiques selon le conte : magique, forêt, rêve, aventure douce ou nuit calme
- réglage du volume de l’ambiance et possibilité de la couper

Les fonds musicaux des histoires sont générés par le code de l’application : aucun enregistrement musical tiers n’est embarqué pour cette partie.

### Comptines

Les comptines ne sont plus récitées par la synthèse vocale. Une comptine ne peut jouer que lorsqu’une vraie piste musicale réutilisable légalement est renseignée.

Pistes actuellement branchées :

- **Frère Jacques** — source Wikimedia Commons, auteur du fichier CambridgeBayWeather, licence CC BY-SA 3.0 / GFDL
- **Au clair de la lune (archive de 1860 restaurée)** — source Wikimedia Commons / First Sounds, licence indiquée CC BY 1.0 avec éléments du domaine public selon la page de description

Les autres titres restent visibles mais sont marqués comme « version chantée à ajouter » jusqu’à ce qu’une piste audio correctement licenciée soit disponible.

## Interface

- design responsive mobile
- mode nuit
- bibliothèque horizontale
- lecteur d’histoire avec progression par pages
- contrôles audio séparés pour narration, ambiance et chansons

## APK avec GitHub Actions

À chaque push sur `main`, le workflow **Build Android APK** génère un artefact nommé `Histoires-Comptines-APK`.

## Développement local

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Prérequis conseillés : Node.js 20+ et Java 17.
