import Slider from '@react-native-community/slider';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { s } from 'react-native-wind';
import { useLocalAudio } from '../hooks/useLocalAudio';
import { useAudioStore } from '../store/audioStore';

interface ProgressBarProps {
  isDark?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ isDark = false }) => {
  const { currentTime, duration, isPlaying } = useAudioStore();
  const { seekTo } = useLocalAudio();
  const [isDragging, setIsDragging] = useState(false);
  const [tempValue, setTempValue] = useState(0);
  const lastSeekRef = useRef<number>(0);

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleValueChange = (value: number) => {
    const now = Date.now();
    
    // Throttle seeking to prevent overlapping audio
    if (now - lastSeekRef.current < 100) {
      return;
    }
    
    setTempValue(value);
    lastSeekRef.current = now;
    
    // Debounced seek
    setTimeout(async () => {
      const positionMs = Math.floor(value * duration);
      await seekTo(positionMs);
    }, 50);
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={s`px-6 py-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Slider
        value={progress}
        onValueChange={handleValueChange}
        minimumValue={0}
        maximumValue={1}
        minimumTrackTintColor="#e05338"
        maximumTrackTintColor={isDark ? '#374151' : '#e5e7eb'}
        thumbTintColor="#dbdada"
        disabled={duration === 0}
      />

      <View style={s`flex-row justify-between mt-2`}>
        <Text style={s`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {formatTime(currentTime)}
        </Text>
        <Text style={s`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};