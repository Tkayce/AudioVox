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
  const { 
    isPlaying, 
    isBuffering, 
    playbackRate,
    currentTrack,
    nextTrack,
    previousTrack 
  } = useAudioStore();
  
  const { play, pause, setPlaybackRate, switchToTrack, status } = useLocalAudio();

  const handleNext = async () => {
    console.log('=== NEXT BUTTON PRESSED ===');
    nextTrack(); // Update store state
    const newTrack = useAudioStore.getState().currentTrack;
    if (newTrack) {
      console.log('NEXT: Switching to track:', newTrack.title);
      await switchToTrack(newTrack, { autoPlay: true });
      console.log('NEXT: switchToTrack completed');
    }
  };

  const handlePrevious = async () => {
    console.log('=== PREVIOUS BUTTON PRESSED ===');
    previousTrack(); // Update store state
    const newTrack = useAudioStore.getState().currentTrack;
    if (newTrack) {
      await switchToTrack(newTrack, { autoPlay: true });
    }
  };

  const handlePlayPause = async () => {
    console.log('=== PLAY/PAUSE BUTTON PRESSED ===');
    console.log('Current status playing:', status?.playing);
    console.log('Current track:', currentTrack?.title);
    
    if (status?.playing) {
      console.log('Attempting to pause...');
      const success = await pause();
      console.log('Pause result:', success);
    } else {
      console.log('Attempting to play...');
      const success = await play();
      console.log('Play result:', success);
    }
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
          disabled={!currentTrack || isBuffering}
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