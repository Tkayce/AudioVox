import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  uri: string | number;
  isLocal?: boolean;
  mood?: 'worship' | 'study' | 'chill' | 'workout' | 'general';
}

const arePlaylistsEqual = (a: Track[], b: Track[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.id !== b[i]?.id) {
      return false;
    }
  }
  return true;
};

interface AudioPlayerState {
  // Player state
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  
  // Playlist
  playlist: Track[];
  currentIndex: number;
  isShuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  
  // UI state
  isDarkMode: boolean;
  
  // Actions
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setPlaylist: (playlist: Track[]) => void;  
  setCurrentIndex: (index: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  toggleDarkMode: () => void;
  
  // Player controls
  nextTrack: () => void;
  previousTrack: () => void;
  autoPlayNext: () => void;
}

export const useAudioStore = create<AudioPlayerState>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  playlist: [],
  currentIndex: -1,
  isShuffleEnabled: false,
  repeatMode: 'off',
  isDarkMode: true, // Dark mode as default
  
  // Setters
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (playing) => set((state) => (state.isPlaying === playing ? {} : { isPlaying: playing })),
    setIsBuffering: (buffering) => set((state) => (state.isBuffering === buffering ? {} : { isBuffering: buffering })),
    setCurrentTime: (time) => set((state) => (state.currentTime === time ? {} : { currentTime: time })),
    setDuration: (duration) => set((state) => (state.duration === duration ? {} : { duration })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
    setPlaylist: (playlist) => set((state) => (arePlaylistsEqual(state.playlist, playlist) ? {} : { playlist })),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  toggleShuffle: () => set((state) => ({ isShuffleEnabled: !state.isShuffleEnabled })),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // Navigation controls
  nextTrack: () => {
    const { playlist, currentIndex, isShuffleEnabled, repeatMode, setCurrentIndex, setCurrentTrack } = get();
    
    if (repeatMode === 'one') {
      // Stay on current track
      return;
    }
    
    if (isShuffleEnabled) {
      // Random track (excluding current)
      const availableIndices = playlist.map((_, index) => index).filter(index => index !== currentIndex);
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentIndex(randomIndex);
        setCurrentTrack(playlist[randomIndex]);
      }
    } else {
      // Sequential play
      if (currentIndex < playlist.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTrack(playlist[nextIndex]);
      } else if (repeatMode === 'all') {
        // Loop back to first track
        setCurrentIndex(0);
        setCurrentTrack(playlist[0]);
      }
    }
  },
  
  previousTrack: () => {
    const { playlist, currentIndex, setCurrentIndex, setCurrentTrack } = get();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentTrack(playlist[prevIndex]);
    }
  },
  
  autoPlayNext: () => {
    const { nextTrack } = get();
    nextTrack(); // This will update currentTrack and trigger auto-initialization
  },
}));