import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { s } from 'react-native-wind';
import { useLocalAudio } from '../hooks/useLocalAudio';
import { useAudioStore } from '../store/audioStore';

interface PlayerControlsProps {
  isDark?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ isDark = false }) => {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const isBuffering = useAudioStore((state) => state.isBuffering);
  const playbackRate = useAudioStore((state) => state.playbackRate);
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const nextTrack = useAudioStore((state) => state.nextTrack);
  const previousTrack = useAudioStore((state) => state.previousTrack);
  
  const { play, pause, setPlaybackRate, switchToTrack, togglePlayPause } = useLocalAudio();

  const handleNext = () => {
    nextTrack(); // Update store state
    const newTrack = useAudioStore.getState().currentTrack;
    if (newTrack) {
      switchToTrack(newTrack, { autoPlay: true }).catch(() => undefined);
    }
  };

  const handlePrevious = () => {
    previousTrack(); // Update store state
    const newTrack = useAudioStore.getState().currentTrack;
    if (newTrack) {
      switchToTrack(newTrack, { autoPlay: true }).catch(() => undefined);
    }
  };

  const handlePlayPause = () => {
    togglePlayPause().catch(() => undefined);
  };

  const handleSpeedChange = async () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    await setPlaybackRate(newSpeed);
  };

  const iconColor = isDark ? '#ffffff' : '#000000';
  const accentColor = '#e05338';

  return (
    <View style={s`px-6 py-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Main Controls */}
      <View style={s`flex-row items-center justify-center space-x-8`}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={s`p-3`}
          disabled={!currentTrack}
          activeOpacity={currentTrack ? 0.8 : 1}
        >
          <Ionicons 
            name="play-skip-back" 
            size={32} 
            color={currentTrack ? iconColor : (isDark ? '#4b5563' : '#9ca3af')} 
          />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          style={[s`rounded-full p-4`, { 
            backgroundColor: accentColor,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center'
          }]}
          disabled={!currentTrack}
          activeOpacity={currentTrack ? 0.85 : 1}
        >
          {isBuffering ? (
            <ActivityIndicator size={30} color="white" />
          ) : (
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={30} 
              color="white" 
            />
          )}
        </TouchableOpacity>

        {/* Next Track */}
        <TouchableOpacity
          onPress={handleNext}
          style={s`p-3`}
          disabled={!currentTrack}
          activeOpacity={currentTrack ? 0.8 : 1}
        >
          <Ionicons 
            name="play-skip-forward" 
            size={32} 
            color={currentTrack ? iconColor : (isDark ? '#4b5563' : '#9ca3af')} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};