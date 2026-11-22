# BuzzNotes privacy policy

Effective date: <EFFECTIVE_DATE>

This policy covers the BuzzNotes app for Android. The app is owned by KeyZero d.o.o., Croatia, and developed by Branimir Tomeljak. For questions about this policy, write to <CONTACT_EMAIL>.

## In short

Everything you create in BuzzNotes stays on your device, unless you export it or your Android backup copies it (see below). The app has no accounts and no servers, contains no analytics, advertising or tracking, and sends nothing over the internet. The developer never receives your data.

## What the app uses and why

- **Microphone**: to record voice notes, only while you are recording.
- **Camera**: to take a photo for a recording, only when you tap the camera button.
- **Photos you pick**: when you add photos with the system photo picker, the app copies only the photos you select.
- **Text you type**: the names of your locations and beehives, and the notes on your recordings.
- **A random installation id**: created on first launch and stored with your records. It is not linked to you, your device or any account.
- **Settings**: your language and whether you have seen the welcome screen.

Locations in BuzzNotes are names you type; the app does not use GPS or your device's location. Photos keep the metadata stored in them, which can include where a photo was taken if your camera recorded it. BuzzNotes does not read this metadata, but it stays in the photo, also in exports.

## Where your data is stored

Your data, recordings and photos are stored in the app's private storage on your device and, if Android backup is on, in your Google account backup (see Android backup). The app itself shares nothing with third parties.

## Export and import

Export creates one file with all your locations, beehives, recordings, notes and photos, including the installation id stored with them. You choose where to send it through Android's share sheet, for example by email, to Google Drive or over Bluetooth. The developer never receives it, and once you send it, the app or service you chose handles it under its own terms. The app keeps the latest export file in its cache until the next export replaces it or Android clears the cache.

Import reads only the file you pick in Android's file picker.

## Android backup

If backup is turned on in your device settings, Android may include the app's data in your Google account backup, and it can copy the data to a new phone when you transfer your data to it. Google stores that backup, and the developer cannot access it. Android limits this backup to 25 MB per app and backs up nothing for an app whose data is larger, so it is not a reliable backup of your recordings; use Export instead.

## Keeping and deleting your data

Your data stays on your device until you delete it. Removing a photo deletes it, and deleting a recording deletes its audio and photos. Deleting a beehive deletes its recordings, and deleting a location deletes its beehives and recordings, each with their audio and photos. There are two exceptions. When an import replaces a recording that is already on your device, that recording's earlier audio and photo files can stay in the app's storage. So can the files of a new recording whose save failed. Clearing the app's storage or uninstalling it removes them.

Recording audio and adding photos leave temporary copies in the app's cache, which Android may clear when it needs space. Clearing the app's cache in Android settings removes them at once. Uninstalling the app, or clearing its storage, deletes all of its data. Neither affects files you exported or your Google backup; delete those where they are stored.

## Permissions

| Permission | Why the app has it |
| --- | --- |
| `RECORD_AUDIO` | To record voice notes |
| `CAMERA` | To take photos for a recording |
| `WRITE_EXTERNAL_STORAGE` | Asked for only on Android 9 and older, where the camera component the app uses requires it before it opens the camera |
| `READ_EXTERNAL_STORAGE` | Declared by the app template and its libraries, but never asked for; the photo picker needs no permission |
| `MODIFY_AUDIO_SETTINGS` | Lets the audio library set up recording and playback |
| `VIBRATE` | For short vibrations when you tap some buttons |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Declared by the app's file and audio libraries; BuzzNotes sends and receives nothing over the network |

## Children

BuzzNotes is made for beekeepers and is not directed at children.

## Changes to this policy

If this policy changes, the new version will be published at the same address with a new effective date.
