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

## Platforms

- **Android**: the only shipped target, built in the cloud with EAS Build.
- **Web**: a limited UI preview for development. Recording, photos and export/import are turned off there, because browser media URLs stop working after a reload and file storage is not available.
- **iOS**: not configured.

## Stack

Expo SDK 58 · React Native 0.88 (New Architecture, Hermes) · React 19.3 · TypeScript 6.0 (strict) · Expo Router 58 · expo-audio 58 · expo-image-picker 58 · expo-file-system 58 · AsyncStorage 2.2 · i18next 27 (with the intl-pluralrules polyfill) · Jest 30 (jest-expo) · ESLint 8 · Prettier 3 · GitHub Actions · EAS Build

## Architecture

- `app/`: screens, with file-based routing through Expo Router: the tabs screen (Locations, Recent and Priority), `location/[id]`, `beehive/[id]`, `recording/[id]`, `record` and `settings`
- `src/contexts/DataContext.tsx`: app state in React Context, driven by a pure, unit-tested reducer (`dataReducer`, exported for tests). It saves the whole dataset after every change, and never before a successful load.
- `src/services/`: audio, file storage, persistence, and export/import
- Data model: Location → Beehive → Recording. A recording stores its audio file, duration, priority, solved status, notes and photos.
- Local-first: data stays on the device (AsyncStorage plus the app's documents folder). Every record carries a user ID, so it can be attached to an account once cloud sync is added.
- Storage keys: `@buzznotes/locations`, `@buzznotes/beehives` and `@buzznotes/recordings` hold JSON arrays and are written together in one AsyncStorage `multiSet`. `@buzznotes/userId` (a random installation id), `@buzznotes/language` and `@buzznotes/onboardingDone` hold settings.
- Media files: audio in `recordings/` (`.m4a`) and photos in `photos/` (`.jpg`), inside the app's documents folder. Records store each file's full path. Audio is named after a recording id or a temporary `rec_<timestamp>` id, and photo names add an index, or a timestamp and an index. Only plain names directly inside those two folders count as app media, and deletes touch nothing else.
- Export file: a version-1 `.buzznotes.json` with `version`, `exportedAt`, `locations`, `beehives` and `recordings`, where each recording can carry its audio as `audioBase64` and its photos as `photosBase64`. Import rejects other versions and recording ids that are not plain names. It merges by id (the newer `updatedAt` wins; on a tie, the imported copy), and writes no media for records whose local copy is newer.

## Getting started

Requires Node 22.13 or newer on Node 22, 24.3 or newer on Node 24, or Node 26 and later, the minimums for Expo SDK 58, React Native 0.88 and Metro; CI uses the latest Node 22.

```bash
npm ci
npm start          # Expo dev server
npm run android
npm run web
```

Quality checks (the same ones CI runs, in this order, on pushes and pull requests to `master`):

```bash
npx tsc --noEmit
npm run lint
npm run format:check
npm test
```

`npm run format` fixes formatting. Prettier only covers `src/` and `app/`.

Android builds with EAS:

```bash
npx eas-cli build --platform android --profile preview     # installable APK
npx eas-cli build --platform android --profile production  # AAB for Google Play
npx eas-cli submit --platform android --profile production # upload to Play's internal track as a draft
```

EAS keeps the Android version code (`appVersionSource: remote`) and increments it on every production build; bump `version` in `app.json` and `package.json` by hand. The Play service-account key is stored on EAS. Per the EAS docs, once the app exists in Play Console the first submit creates its first internal release; if Play rejects it, upload that AAB by hand. Every push to `master` also starts a preview build through EAS Workflows (`.eas/workflows/build-android-preview.yml`); `[skip eas]` in the commit message skips it.

## Data and backup

- Data stays on the device unless the user exports it or Android backup copies it; there are no accounts, servers, analytics or ads. [PRIVACY.md](PRIVACY.md) is the privacy policy for the Android app.
- Export is the only complete backup. It puts all data, recordings and photos into one file, shared through Android's share sheet, and Import merges such a file back in.
- Android Auto Backup can also copy the app's data to the user's Google account when device backup is on. It is capped at 25 MB per app and skips an app with more data, so it is not a reliable backup of recordings.

## Known limitations

- No accounts or sync: data lives on one device. Export and Import are the only reliable way to move it; Android backup or a phone-to-phone transfer may also copy it.
- Export and import hold the whole file in memory, with audio and photos as base64, so very large backups may run out of memory on some phones.
- No crash reporting beyond Google Play's Android vitals.
- Screens have no tests. Jest covers the reducer, the data provider and persistence, file storage, export/import, plural forms, release config, the theme, the responsive hook and utilities.

## Roadmap

- Cloud sync and accounts with Firebase (groundwork in `src/services/firebase.ts`)
- iOS build
- Speech-to-text for recordings
- Reminders for high-priority items

## License

Proprietary, owned by KeyZero d.o.o.; see [LICENSE](LICENSE).
