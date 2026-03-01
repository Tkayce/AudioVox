import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from 'react-native-wind';
import { PlayerControls } from '../components/PlayerControls';
import { ProgressBar } from '../components/ProgressBar';
import { TrackArtwork } from '../components/TrackArtwork';
import { useLocalAudio } from '../hooks/useLocalAudio';
import { useAudioStore } from '../store/audioStore';

export const HomeScreen: React.FC = () => {
  const isDarkMode = useAudioStore((state) => state.isDarkMode);
  const toggleDarkMode = useAudioStore((state) => state.toggleDarkMode);
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const isBuffering = useAudioStore((state) => state.isBuffering);
  const playbackRate = useAudioStore((state) => state.playbackRate);
  const setPlaybackRateValue = useAudioStore((state) => state.setPlaybackRate);
  const isShuffleEnabled = useAudioStore((state) => state.isShuffleEnabled);
  const toggleShuffle = useAudioStore((state) => state.toggleShuffle);
  const repeatMode = useAudioStore((state) => state.repeatMode);
  const setRepeatMode = useAudioStore((state) => state.setRepeatMode);
  const { isPlayerReady, setPlaybackRate: setPlayerRate } = useLocalAudio();

  const handleSpeedChange = async () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    // Update global store value for UI and logic
    setPlaybackRateValue(newSpeed);

    // Apply to the underlying audio player if it's ready
    await setPlayerRate(newSpeed);
  };

  const handleRepeatToggle = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return 'repeat-outline';
      case 'all':
        return 'repeat';
      default:
        return 'repeat-outline';
    }
  };

  const getRepeatColor = () => {
    if (repeatMode === 'off') {
      return currentTrack ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#4b5563' : '#d1d5db');
    }
    return '#e05338'; // Active color
  };

  // No demo track - start with empty player until user selects music

  return (
    <SafeAreaView 
      style={s`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#ffffff'}
      />

      {/* Header */}
      <View style={s`flex-row items-center justify-between px-6 py-4`}>
        <View>
          <Ionicons 
            name="musical-notes" 
            size={24} 
            color='#e05338' 
          />
        </View>
        
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={s`p-2 rounded-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <Ionicons 
            name={isDarkMode ? 'sunny' : 'moon'} 
            size={20} 
            color={isDarkMode ? '#fbbf24' : '#6b7280'} 
          />
        </TouchableOpacity>
      </View>

      <View style={s`flex-1`}>
        {/* Track Artwork */}
        <View style={s`mt-8 mb-6`}>
          <TrackArtwork 
            size={150} 
            isDark={isDarkMode} 
          />
        </View>

        {/* Secondary Controls (moved to top) */}
        <View style={s`flex-row items-center justify-between px-8 mb-4`}>
          {/* Shuffle */}
          <TouchableOpacity 
            style={s`p-3`} 
            disabled={!currentTrack}
            onPress={toggleShuffle}
          >
            <Ionicons 
              name="shuffle" 
              size={24} 
              color={isShuffleEnabled ? '#e05338' : (currentTrack ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#4b5563' : '#d1d5db'))} 
            />
          </TouchableOpacity>

          {/* Playback Speed */}
          <TouchableOpacity 
            onPress={handleSpeedChange}
            style={[s`px-4 py-2 rounded-full`, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}
            disabled={!currentTrack}
          >
            <Text style={s`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {playbackRate}x
            </Text>
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity 
            style={s`p-3`} 
            disabled={!currentTrack}
            onPress={handleRepeatToggle}
          >
            <Ionicons 
              name={getRepeatIcon()} 
              size={24} 
              color={getRepeatColor()} 
            />
            {repeatMode === 'one' && (
              <View style={[s`absolute -top-1 -right-1 rounded-full`, { backgroundColor: '#e05338', width: 12, height: 12, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={s`text-white text-xs font-bold`}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <ProgressBar isDark={isDarkMode} />

        {/* Player Controls (main play/pause/next/prev only) */}
        <PlayerControls isDark={isDarkMode} />

        {/* Additional Info */}
        {!currentTrack && (
          <View style={s`items-center mt-8 px-6`}>
            <Ionicons 
              name="library" 
              size={20} 
              color={isDarkMode ? '#6b7280' : '#9ca3af'} 
            />
            <Text style={s`text-lg font-semibold text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No Music Selected
            </Text>
          </View>
        )}

        {currentTrack && !isPlaying && (!isPlayerReady() || isBuffering) && (
          <View style={s`items-center mt-4`}>
            <Ionicons 
              name="information-circle" 
              size={20} 
              color={isDarkMode ? '#6b7280' : '#9ca3af'} 
            />
            <Text style={s`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading audio player...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};