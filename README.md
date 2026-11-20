# BuzzNotes

[![CI](https://github.com/BranimirTomeljak/BuzzNotes/actions/workflows/ci.yml/badge.svg)](https://github.com/BranimirTomeljak/BuzzNotes/actions/workflows/ci.yml)

Voice notes for beekeepers. Writing notes at the hive with gloves on doesn't work, so BuzzNotes lets a beekeeper record a short voice note per hive, give it a priority, and find it again later by apiary, by hive, or by what needs attention first.

Built with Expo and React Native for Android, with a web build used during development. It works fully offline, and the interface is in Croatian and English.

<!-- Screenshots: add 3–4 here (locations, beehive, recording, recording detail). -->

## Features

- Apiaries contain beehives, and beehives contain voice recordings
- Record and play back notes, and attach photos and text to each recording
- Three-level priority and a solved flag, with Recent and Priority views for every apiary and hive that put unsolved items first
- Full-screen photo viewer with swipe, pinch-to-zoom and double-tap
- Export everything (data, recordings and photos) to a single versioned `.buzznotes.json` file and import it on another device, merging by ID
- Croatian (default) and English, first-run onboarding, and a two-column tablet layout

## Stack

Expo SDK 54 · React Native 0.81 (New Architecture) · React 19 · TypeScript (strict) · Expo Router · expo-audio · expo-image-picker · expo-file-system · AsyncStorage · i18next · Jest · ESLint · Prettier · GitHub Actions · EAS Build

## Architecture

- `app/`: screens, with file-based routing through Expo Router
- `src/contexts/DataContext.tsx`: app state in React Context, driven by a pure, unit-tested reducer
- `src/services/`: audio, file storage, persistence, and export/import
- Data model: Location → Beehive → Recording. A recording stores its audio file, duration, priority, solved status, notes and photos.
- Local-first: data stays on the device (AsyncStorage plus the app's documents folder). Every record carries a user ID, so it can be attached to an account once cloud sync is added.

## Getting started

```bash
npm install
npm start          # Expo dev server
npm run android
npm run web
```

Quality checks (the same ones CI runs on every push and pull request):

```bash
npx tsc --noEmit
npm run lint
npm test
```

Android builds with EAS:

```bash
npx eas-cli build --platform android --profile preview     # installable APK
npx eas-cli build --platform android --profile production  # AAB for Google Play
```

## Roadmap

- Cloud sync and accounts with Firebase (groundwork in `src/services/firebase.ts`)
- iOS build
- Speech-to-text for recordings
- Reminders for high-priority items
