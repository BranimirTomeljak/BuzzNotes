# BuzzNotes - Beekeeper Voice Notes App

## Project Overview
React Native (Expo) app for beekeepers to manage voice recordings organized by location and beehive. Targets Android + Web.

**Important**: Keep this CLAUDE.md updated after every noteworthy change (new features, architectural decisions, convention changes, pitfalls discovered). This file is the source of truth for the project.

## Tech Stack
- **Framework**: Expo SDK 54 + TypeScript
- **Navigation**: Expo Router v6 (file-based routing in `app/` directory)
- **Backend**: Offline-first (AsyncStorage). Firebase code kept for future cloud sync.
- **Audio**: expo-audio (migrated from deprecated expo-av)
- **Photos**: expo-image-picker (camera + gallery), file-based storage in `photos/` directory, pinch-to-zoom via react-native-gesture-handler
- **Haptics**: expo-haptics (no-op on web)
- **Icons**: @expo/vector-icons (Ionicons + MaterialCommunityIcons) — no emojis in UI
- **State**: React Context + useReducer
- **i18n**: i18next (Croatian default, English)
- **Export/Import**: expo-sharing + expo-file-system

## Commands
- `npm start` / `npx expo start` - Start dev server
- `npm run web` - Start for web
- `npm run android` - Start for Android
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run format` - Auto-format with Prettier
- `npm run format:check` - Check formatting without writing
- `npx tsc --noEmit` - TypeScript type check
- `npx expo export --platform web` - Verify web build

### EAS Build (Android APK/AAB)

`eas.json` has two profiles:
- **`preview`** — builds an APK (directly installable on Android)
- **`production`** — builds AAB (for Play Store upload)

Login first: `npx eas-cli login`

Build APK: `npx eas-cli build --platform android --profile preview`

This runs in the cloud on EAS servers (free tier: 30 builds/month). It will:
1. Upload the project
2. Build the APK (~5-10 min)
3. Return a download link for the `.apk`

Expo account required — sign up free at https://expo.dev/signup

### GitHub Auto-Build

EAS Workflows auto-build on every push to `master`. Config: `.eas/workflows/build-android-preview.yml`.

**Setup (one-time):**
1. Link GitHub repo in Expo dashboard → Project Settings → GitHub
2. Run at least one CLI build first (`npx eas-cli build --platform android --profile preview`)

After that, every push to `master` triggers an APK build in the cloud. Download link appears in Expo dashboard → Builds.

**Skip a build:** Include `[skip eas]` in the commit message.

### CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every push to `master` and on PRs:
1. TypeScript type check (`npx tsc --noEmit`)
2. ESLint (`npm run lint`)
3. Prettier check (`npm run format:check`)
4. Jest tests (`npm test`)

### Testing

- **Framework**: jest-expo preset
- **Test files**: `src/__tests__/*.test.ts(x)`; tests that contain JSX must be `.tsx`
- **Setup**: `jest.setup.js` mocks AsyncStorage
- **Shared fake**: `src/testUtils/fakeFileSystem.ts` is an in-memory, Android-like `File`/`Directory`/`Paths` with a `fakeFs` helper (`reset`, `seed`, `read`, `list`). It lives outside `__tests__` because Jest runs every file in there.
- **Coverage**: formatting utils, sorting utils, data reducer, export/import, photo storage, and `DataProvider` (provider tests render it with react-test-renderer and read AsyncStorage back)
- `dataReducer` is exported from `DataContext.tsx` for direct unit testing

### Code Quality

- **ESLint**: `eslint-config-expo` + `eslint-config-prettier` (`.eslintrc.js`)
- **Prettier**: single quotes, trailing commas, 100 char width (`.prettierrc`)
- Only `firebaseConfig.ts` has lint warnings (unused imports kept intentionally for future use)

### Versioning

- `app.json` `version` — semantic version string (e.g. `"1.0.0"`)
- `app.json` `android.versionCode` — integer, increment on each release
- `package.json` `version` — keep in sync with `app.json`

## Project Structure
- `app/` - Expo Router screens (tabs, location/[id], beehive/[id], recording/[id], record, settings)
- `src/components/` - Reusable UI components
- `src/contexts/` - React Contexts (Data). AuthContext kept for future use.
- `src/services/` - Audio, sync, storage, export/import, photo storage services
- `src/models/` - TypeScript interfaces and enums
- `src/theme/` - Design system (colors, spacing, typography, shadows)
- `src/i18n/` - Internationalization files (hr, en)
- `src/hooks/` - Custom hooks (useDetailTabBar, useResponsive)
- `src/utils/` - Utility functions (sorting, formatting, confirmDelete)
- `src/__tests__/` - Jest unit tests
- `src/testUtils/` - Jest-only helpers (`fakeFileSystem`); never imported by app code
- `src/screens/` - Screens not currently routed (auth.tsx, OnboardingScreen.tsx)

## Conventions
- Voice note dates displayed as `dd.mm.yyyy HH:mm` (24h, using `createdAt` timestamp)
- Croatian is the default language
- Colors follow Organic Soft honey/amber theme (primary: #B8860B, bg: #FAF7F0, surface: #F0EBE0, text: #3D3521)
- Large touch targets and font sizes for accessibility
- Priority system: HIGH (red #EF5350), MEDIUM (yellow #F9A825), LOW (blue #5C9CE6)
- Priority colors are consistent everywhere — badge, picker, and card tint all use the same scheme
- Priority badge always shows actual priority color, even on solved items (no green override)
- Natural numeric sorting for names (1, 2, 10 not 1, 10, 2)
- No Unicode emojis in UI — all icons use @expo/vector-icons

## UI Design

### Icons
- Locations: `Ionicons: location-outline`
- Beehives: `MaterialCommunityIcons: archive-outline` (represents LR/Langstroth hive box)
- Recordings: `Ionicons: mic` / `mic-outline`
- Priority: `Ionicons: alert-circle` (high), `warning-outline` (medium), `information-circle-outline` (low)
- Navigation: `Ionicons: location-outline` (locations tab), `time-outline` (recent), `flag-outline` (priority)

### Cards & Layout
- Cards: white background with warm shadow (`#8B6914` shadowColor), `borderRadius.xl` (20px)
- Tabs: pill-style with `primaryTint` active background, `primaryDark` (#8B6914) active text
- Inputs: surface-colored (#F0EBE0) with no border
- Dialogs: borderRadius 24
- FAB: single record mic, 56x56, bottom: 100, `fab` color (#D4A530)
- Tab bar: white, pill-style highlighting, paddingBottom 24 (clears gesture bar)

### Voice Note Cards
- **Unsolved**: full card with priority-based background tint (HIGH: #FFECEC, MEDIUM: #FFF8E0, LOW: #ECF2FF)
  - Shows notes preview (2-line truncated) if recording has notes
  - Shows photo thumbnail row (up to 4 + "+N" badge) if recording has photos
  - Tap card to navigate to recording detail screen (`/recording/[id]`)
- **Solved**: compact card, surface background, greyed-out audio player (muted prop)
- **Checkbox toggle**: top-right of both card types, always visible
  - Unsolved: `checkmark-circle-outline` (light grey) — tap to mark solved
  - Solved: `checkmark-circle` (green) — tap to unresolve
- Solved items sorted to bottom of lists, separated by a "SOLVED" divider line
- `showSolvedDivider` prop on RecordingCard controls the divider (set on first solved item in list)

### Recording Detail Screen (`app/recording/[id].tsx`)
- Full view of a recording with editable notes and photo gallery
- Meta info card (beehive, location, duration)
- Priority badge (tap to cycle) + solved toggle chip
- Audio player with priority tint (or muted if solved)
- Notes section with inline edit (pencil icon toggles edit mode)
- Photo grid (2 columns) with camera/gallery add buttons and remove buttons
- Tapping a photo opens fullscreen viewer with horizontal swipe (paginated FlatList), pinch-to-zoom (1x–5x), double-tap to toggle 2x zoom, and "1 / N" counter
- Deleting a recording deletes its audio and photos by their stored paths; deletes are limited to the app's media folders (`deleteRecordingFiles`, guarded by `isAppMediaPath`)

### Audio Player
- Play/pause button (44x44 circle), slider with draggable thumb (16px), time display
- Stops after playing once (no auto-restart) — uses `finishedRef` pattern
- `muted` prop: grey play button, grey slider, lighter time text (used on solved cards)
- Slider uses `pageX` + `measureInWindow` for reliable drag (not `locationX`)
- Slider accepts optional `tintColor` prop to override fill/thumb color

### Responsive Design (Phone + Tablet)
- Breakpoint: 600px (phone < 600, tablet >= 600)
- `useResponsive()` hook (`src/hooks/useResponsive.ts`) — single source of responsive values
- Phone layout is unchanged — all responsive logic is additive
- Tablet (portrait ~10"): 2-column lists, 3-column photo grid, 800px max content width, 1.15x font scale
- FlatList `key={columns}` forces remount when columns change (React Native requirement)
- Cards accept optional `style` prop for multi-column `flex: 1` override
- Solved divider disabled in multi-column mode (would only span one cell)
- Photo sizes computed dynamically from screen width + column count (not module-level constants)
- FAB positioned relative to content boundary on tablet (not screen edge)

## Shared Components & Hooks

Recording list scenes, editable name rows, tab bar config, and delete confirmations are deduplicated into shared pieces:

- **`RecordingListScene`** (`src/components/`) — Sorted FlatList of RecordingCards with solved divider. Used by all Recent/Priority scenes across tabs, location detail, and beehive detail. Props: `recordings`, `sortFn`, `emptyIcon`, optional `getBeehiveName`/`getLocationName` resolvers, optional `onPressRecording` for navigation to detail.
- **`photoStorage`** (`src/services/`) — File-based photo storage: `savePhoto`, `deletePhoto`, `deleteRecordingFiles`, `isAppMediaPath`, `ensurePhotosDir`. `isAppMediaPath` accepts only a `[\w-]+.(m4a|jpg)` name directly inside `documents/recordings/` or `documents/photos/`, and `deletePhoto` deletes nothing else. Media file names in use (all must keep working):
  - record flow: `recordings/rec_<ts>.m4a` and `photos/rec_<ts>_<ts2>_<i>.jpg` (the record keeps the temporary `rec_<ts>` id in its file names but gets a UUID)
  - detail screen: `photos/<id>_<ts>_<i>.jpg`
  - import: `recordings/<id>.m4a` and `photos/<id>_<i>.jpg`
  - older files: `photos/rec_<ts>_<i>.jpg` and `photos/<id>_<n>.jpg`
- **`EditableNameRow`** (`src/components/`) — Editable name with icon + delete button. Used by location and beehive detail screens. Props: `name`, `icon` (`'location-outline'` | `'archive-outline'`), `onSave`, `onDelete`.
- **`useDetailTabBar`** (`src/hooks/`) — Shared pill-style tab bar for detail screens. Returns `{ renderTabBar }`. No arguments needed.
- **`confirmDelete`** (`src/utils/`) — Platform-aware delete confirmation (web `confirm()` / native `Alert.alert`). Used by RecordingCard, location detail, beehive detail.
- **`FloatingActions`** (`src/components/`) — Solo record mic FAB. Shows alert when no locations exist. Positioned at bottom-right, responsive on tablet.
- **Add Location**: dashed footer card in Locations tab FlatList, opens add-location dialog
- **Add Beehive**: dashed footer card in location detail beehive FlatList, opens add-beehive dialog

## Architecture: Offline-First with Local User ID

The app runs fully offline with no Firebase dependency at runtime. A local UUID is generated on first launch and stored in AsyncStorage as `@buzznotes/userId`. This ID is written to the `userId` field on all locations, beehives, and recordings.

### Export/Import
- Export creates a `.buzznotes.json` file with all data + audio files + photos encoded as base64
- Uses `expo-sharing` to share via email, Drive, Bluetooth, etc.
- Import uses `File.pickFileAsync()` from expo-file-system to select a file. A cancelled pick rejects with code `ERR_PICKER_CANCELLED` (it never resolves to null); `importData` turns that into `null`, so no error toast appears
- Import restores audio to `recordings/` dir and photos to `photos/` dir, updating `localPath` and `photos` paths
- Merge strategy: imported items with same ID update existing (by updatedAt); new items are added
- Import writes no media for a record whose local copy is newer (`importData(existing)` skips it when `local.updatedAt > incoming.updatedAt`, the exact complement of the merge's `>=`), so an older backup never overwrites newer photos or audio

### Files Kept for Future Firebase Integration
- `firebaseConfig.ts` - Firebase config placeholder (initializes Firebase at import time — do NOT import at top level)
- `src/services/firebase.ts` - Firestore CRUD operations (static import of firebaseConfig)
- `src/services/sync.ts` - Bidirectional sync logic (local save functions used actively, no firebase imports)
- `src/contexts/AuthContext.tsx` - Auth context with Firebase Auth (static import of firebaseConfig)
- `src/screens/auth.tsx` - Login/register screen (moved OUT of `app/` to prevent Expo Router from auto-loading it and triggering Firebase initialization)

### Why auth.tsx is in src/screens/ (not app/)
Expo Router auto-discovers and evaluates all files in `app/`. The `auth.tsx` screen imports `AuthContext.tsx` which statically imports `firebaseConfig.ts`, which calls `initializeApp()` and `getAuth()` at module load time. This caused a Firebase Auth warning at startup even though auth isn't used yet. Moving it to `src/screens/` prevents this. Move it back to `app/auth.tsx` when re-enabling Firebase.

### Recording Model
The `Recording` type includes optional `notes?: string` and `photos?: string[]` fields for text notes and photo file paths. Photos are added during recording (priority step) or later in the recording detail screen. Notes are entered during recording or edited in the detail screen.

## Firebase Collections (future)
- `locations` - Apiary locations
- `beehives` - Beehives within locations
- `recordings` - Voice recordings for beehives

## Future Firebase Migration Procedure

### Phase 1: Firebase Setup
1. Create Firebase project, fill in `firebaseConfig.ts` with real values
2. Enable Email/Password + Google auth in Firebase Console
3. Enable Firestore in test mode
4. Enable Firebase Storage

### Phase 2: Re-enable Auth
1. Move `src/screens/auth.tsx` back to `app/auth.tsx` (fix import paths back to `../src/...`)
2. In `app/_layout.tsx`: Re-add `AuthProvider` wrapping `DataProvider`, re-add `AuthGuard`
3. In `app/_layout.tsx`: Re-add `auth` screen to Stack
4. In `src/contexts/DataContext.tsx`: Add a `migrateLocalDataToUser(firebaseUid)` function that:
   - Reads `@buzznotes/userId` (local UUID)
   - Updates all locations/beehives/recordings where `userId === localUuid` to `userId = firebaseUid`
   - Saves updated data to AsyncStorage
   - Optionally deletes the local UUID key
5. In DataContext: Re-integrate `useAuth()` — if user is logged in, use `user.uid`; if not, fall back to local UUID

### Phase 3: Enable Sync
1. In DataContext: Re-enable `syncData()` which calls `syncWithFirestore()`
2. On first sync after migration, all local data gets pushed to Firestore
3. Subsequent app opens pull/merge from Firestore
4. Export/Import stays available as backup mechanism

### Migration Anchor Points in Code
- `DataContext.tsx`: `getOrCreateLocalUserId()` stores the UUID — this is the key function
- All data models keep `userId` field populated — no data has empty userId
- `sync.ts`: `mergeArrays()` handles merging by ID + updatedAt — works for migration

## Known Pitfalls
- **uuid package**: `crypto.getRandomValues()` not supported on React Native/Hermes. Use `expo-crypto` `randomUUID()` instead.
- **Firebase lazy loading**: `firebaseConfig.ts` initializes Firebase at import time. Any file that imports it will trigger initialization. Use dynamic `import()` for firebase in runtime code, or keep static imports only in files that aren't auto-loaded.
- **expo-av deprecated in SDK 54**: Use `expo-audio` package instead. Hooks: `useAudioPlayer`, `useAudioPlayerStatus`, `useAudioRecorder`.
- **Slider drag**: Must use `pageX` (absolute coordinates) with `measureInWindow`, not `locationX` (relative to element). Store callbacks in refs to avoid stale PanResponder closures.
- **Expo Router auto-evaluation**: All files in `app/` are discovered and evaluated as routes, even if not rendered. Keep files with heavy imports (Firebase) out of `app/` until needed.
- **Import localPath**: When importing recordings, `localPath` must be updated to the new device's file URI after writing the audio file. The original path from the exporting device is invalid.
- **Recorder cleanup**: Always stop the recorder in useEffect cleanup to prevent microphone staying active after screen unmount. Wrap in try-catch — the native recorder object may already be released (e.g. after `router.replace` triggers unmount post-stop).
- **Router dismiss+push race**: Use `router.replace()` instead of `router.dismiss()` followed by `router.push()` — they race on Android.
- **Never persist after a failed load**: `loadLocalData` rejects on a read or parse error. `DataProvider` then stays in `loading`, shows `common.loadError`, and blocks saves, import and export until a pull-to-refresh loads successfully. That refresh also retries the user id if the first read failed. Saving the empty state would overwrite the user's data.
- **AsyncStorage limits on Android**: the database is capped at 6 MiB, and a single value larger than about 2 MiB cannot be read back (CursorWindow limit). `saveLocalData` refuses to write a recordings value over 1,900,000 UTF-8 bytes (error code `STORAGE_FULL`), and `DataProvider` shows `common.storageFull` instead of the generic `common.saveError`. Nothing saves until recordings are deleted.
- **Stored data version**: there is no `@buzznotes/schemaVersion` key yet; once one exists, a missing key means v1.
- **One toast at a time**: react-native-toast-message replaces the visible toast. On Fabric a tap's dispatch commits and runs effects before the handler's `await` resumes, so a toast shown from an effect is replaced by the handler's own toast. Defer such toasts with `setTimeout(..., 0)`, as the failed-load warning in the persist effect does.
- **File.copy never overwrites**: on Android `File.copy` throws if the target exists, while `File.write` creates or truncates. New media names must be unique, which is why `savePhoto` adds `Date.now()`.
- **Media deletes come first**: deleting a recording, beehive or location removes the files of exactly the recordings the reducer drops (`deleteBeehive` and `deleteLocation` use the same predicates as `DELETE_BEEHIVE` and `DELETE_LOCATION`), before the records go. If that save then fails (for example `STORAGE_FULL`), the record comes back after a restart without its files; this is accepted. Orphaned files that older versions left behind are never swept.
- **Toast text length**: default toasts show one line, about 40 characters. Error toasts wrap to three lines through `toastConfig` in `app/_layout.tsx`, so keep success and info texts short.
- **Denormalised `Recording.locationId`**: it copies its beehive's location. `UPDATE_BEEHIVE` moves it together with the beehive, without bumping the recordings' `updatedAt`, and `SET_ALL` realigns it on load, refresh and import.
- **Whole-dataset writes**: every change rewrites all three data keys with one `AsyncStorage.multiSet` in `saveLocalData`, which is a single SQLite transaction on Android. This is intentional at this data size.
- **Jest: expo-file-system**: jest-expo replaces it with a stub in which `File`, `Directory` and `Paths` are undefined. Every test file that touches files declares `jest.mock('expo-file-system', () => require('../testUtils/fakeFileSystem'))`.
- **Jest: expo-crypto**: the auto-mock's `randomUUID` returns `undefined`; mock it with a counter.
- **Jest: Platform**: `Platform.OS` is `'ios'`; for web paths use `jest.replaceProperty(Platform, 'OS', 'web')`. To exercise the real web stub, also mock `expo-file-system` with `jest.requireActual('expo-file-system')` and `expo-file-system/src/ExpoFileSystem` with `jest.requireActual('expo-file-system/src/ExpoFileSystem.web')`.
- **Jest: react-test-renderer**: 19.1.0 comes in through jest-expo but has no types, so `import ... from 'react-test-renderer'` fails CI's strict `tsc` with TS7016. Use `const { create } = require('react-test-renderer') as { create: (el: React.ReactElement) => { unmount: () => void } };` and take `act` from `'react'`.
- **Jest: provider tests**: also mock `react-native-toast-message` (`{ __esModule: true, default: { show: jest.fn() } }`) and `react-i18next` (`t` returns the key). In `beforeEach`, call `fakeFs.reset()` and `AsyncStorage.clear()`, then seed AsyncStorage. Render inside `await act(async () => ...)`, let effects settle with a zero timeout inside `act`, and unmount in `afterEach`.
- **Jest: i18n**: every test that imports `DataContext` mocks `../i18n` with `{ __esModule: true, default: { t: (key: string) => key } }`. The real module calls `i18n.use(initReactI18next)` at import time, which throws under the `react-i18next` mock and logs a locize notice otherwise.
- **Jest: mocks and lint**: put `jest.mock` calls after the imports (babel hoists them, and this avoids the `import/first` warning), and leave no unused imports, or lint shows a third warning.

## UX Polish

### Haptic Feedback
- `src/utils/haptics.ts` provides `hapticLight`, `hapticMedium`, `hapticSuccess`, `hapticWarning`
- All functions are no-op on web (Platform.OS check)
- Used on: record start/stop (medium), save (success), delete confirmations (warning), priority cycle (light), solved toggle (success)

### Onboarding
- First-launch welcome screen shown before main app
- AsyncStorage key `@buzznotes/onboardingDone` tracks completion
- `src/screens/OnboardingScreen.tsx` — rendered conditionally in `_layout.tsx` (not a route)
- Features: bee icon, 3 feature highlights (locations, beehives, recordings), "Get Started" button
- i18n: both Croatian and English strings in `onboarding.*` namespace
