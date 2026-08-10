# Histoires & Comptines

Application Android de contes et comptines en français. Cette version corrige la lecture audio et modernise complètement l’interface mobile.

## Ce qui a été corrigé

- lecture vocale **native Android** via `@capacitor-community/text-to-speech` avec solution de secours Web Speech
- lecture d’un conte **page par page jusqu’à la fin**, au lieu de rester bloquée sur la première page
- bouton d’arrêt fiable
- réglage de vitesse de lecture
- accès aux réglages de voix Android si la synthèse française n’est pas installée
- interface responsive, mode nuit, bibliothèque horizontale et navigation tactile
- workflow GitHub Actions qui fabrique automatiquement un APK de test

> Les comptines présentes dans le projet ne contiennent pas de fichiers MP3 : elles sont lues par la voix Android. Pour de vraies versions chantées, il faudra ajouter des fichiers audio dont l’utilisation est autorisée.

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

Prérequis conseillés : Node.js 20 et Java 17.
