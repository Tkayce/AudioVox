import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { s } from 'react-native-wind';
import { useAudioStore } from '../store/audioStore';

interface TrackArtworkProps {
  size?: number;
  isDark?: boolean;
}

export const TrackArtwork: React.FC<TrackArtworkProps> = ({ 
  size = 200, 
  isDark = false 
}) => {
  const currentTrack = useAudioStore((state) => state.currentTrack);

  return (
    <View style={s`items-center px-6`}>
      {/* Artwork Placeholder */}
      <View
        style={[s`rounded-2xl items-center justify-center ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`, { width: size, height: size }]}
      >
        <Ionicons 
          name="musical-notes" 
          size={size * 0.4} 
          color='#e05338' 
        />
      </View>

      {/* Track Info */}
      <View style={s`items-center mt-6`}>
        <Text 
          style={s`text-2xl font-bold text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {currentTrack?.title || 'No Track Selected'}
        </Text>
        <Text 
          style={s`text-lg text-center mt-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {currentTrack?.artist || 'Unknown Artist'}
        </Text>
        
        {currentTrack?.isLocal && (
          <View style={s`flex-row items-center mt-2`}>
            <Ionicons 
              name="phone-portrait" 
              size={14} 
              color={isDark ? '#6b7280' : '#9ca3af'} 
            />
            <Text style={s`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Local File
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};