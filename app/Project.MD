-- You a senior Software Enginneer, who has over 10 years of experience. You are to build a native Audio player app that natively plays on user's phone. The following are whats needed:


## Goal: 

Build a high-performance, offline-first React Native audio player using Expo. The app must play local audio files bundled in the app and files from the user's device storage, with background playback support.

1. Tech Stack & Environment
Framework: Use latest SDKs
Audio Engine: expo-audio (Successor to expo-av)
Navigation: Use React native Navigation
File System: expo-file-system and expo-media-library
Styling: Use react-native-wind, where it's imported to every screen like this: import { s } from 'react-native-wind'; Eg style={s`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}
State Management: React Context API or Zustand

2. Core Features (Code Instructions)
Local Asset Playback:
Use useAudioPlayer(require('./assets/track.mp3')) to initialize the player.

-- Implement a custom "Seek Bar" using a Slider that updates in real-time.
-- Crucial: Implement a manual "Replay" logic because expo-audio does not auto-reset playback position on finish.
-- Native File Access:
Implement a "Library" screen using expo-media-library to fetch .mp3 files stored on the phone.
Display files in a FlatList with metadata (title, artist, duration).

Background Audio & UI:
Configure app.json with UIBackgroundModes: ["audio"] for iOS.
Use the useEvent hook to listen to statusChange events to update the UI (Play/Pause/Loading).
Ensure the audio continues playing when the screen is locked.
Playback Controls:
Methods: play(), pause(), seekTo(ms), and setPlaybackRate(speed).
Status: Track currentTime, duration, and isBuffering.

3. Required Project Structure
/assets/audio/ - For bundled demo tracks.
/components/ - PlayerControls.tsx, ProgressBar.tsx, TrackList.tsx.
/hooks/ - useLocalAudio.ts (custom hook to wrap expo-audio logic).
/screens/ - HomeScreen.tsx, LibraryScreen.tsx and other needed screens

4. Specific Implementation Logic (AI Guidelines)
Initialization: When the app starts, request MEDIA_LIBRARY permissions.
Player Lifecycle: Ensure player.release() is called on unmount to prevent memory leaks.
Error Handling: If a local file is missing or a native file is restricted, show a Toast or alert to the user.
Styling: Design a modern "Dark Mode" and "Light Mode" aesthetic with a large circular play button and track artwork placeholders.


### Important

-- Ensure that there's no error left in this project when you end. Ensure you implement everything above professionally.