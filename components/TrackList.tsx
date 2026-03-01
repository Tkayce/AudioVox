import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { s } from 'react-native-wind';
import { useLocalAudio } from '../hooks/useLocalAudio';
import { Track, useAudioStore } from '../store/audioStore';

interface TrackListProps {
  tracks: Track[];
  isDark?: boolean;
  onTrackSelect?: (track: Track, index: number) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ 
  tracks = [], 
  isDark = false,
  onTrackSelect 
}) => {
  const currentTrack = useAudioStore((state) => state.currentTrack);
  const setCurrentTrack = useAudioStore((state) => state.setCurrentTrack);
  const setCurrentIndex = useAudioStore((state) => state.setCurrentIndex);
  const setPlaylist = useAudioStore((state) => state.setPlaylist);
  const { switchToTrack } = useLocalAudio();

  // Safety check for tracks array
  const safeTracks = tracks || [];

  const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTrackPress = (track: Track, index: number) => {
    // Set up playlist and track state first
    setPlaylist(safeTracks);
    setCurrentIndex(index);
    setCurrentTrack(track);
    
    // Use explicit track switching with auto-play for library selection
    void switchToTrack(track, { autoPlay: true });
    
    if (onTrackSelect) {
      onTrackSelect(track, index);
    }
  };

  const renderTrackItem = ({ item: track, index }: { item: Track; index: number }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    
    return (
      <TouchableOpacity
        onPress={() => handleTrackPress(track, index)}
        style={s`flex-row items-center px-4 py-3 ${
          isCurrentTrack 
            ? (isDark ? 'bg-orange-900/20' : 'bg-orange-50') 
            : 'bg-transparent'
        }`}
        activeOpacity={0.7}
      >
        {/* Artwork Placeholder */}
        <View 
          style={s`w-12 h-12 rounded-lg mr-4 items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          {isCurrentTrack ? (
            <Ionicons 
              name="musical-notes" 
              size={20} 
              color='#e05338' 
            />
          ) : (
            <Ionicons 
              name="musical-note" 
              size={20} 
              color={isDark ? '#9ca3af' : '#6b7280'} 
            />
          )}
        </View>

        {/* Track Info */}
        <View style={s`flex-1`}>
          <Text 
            style={s`font-semibold text-base ${
              isCurrentTrack 
                ? 'text-orange-600'
                : (isDark ? 'text-white' : 'text-gray-900')
            }`}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {track.title}
          </Text>
          <Text 
            style={s`text-sm mt-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {track.artist}
          </Text>
        </View>

        {/* Duration and Status */}
        <View style={s`items-end`}>
          <Text style={s`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {formatDuration(track.duration)}
          </Text>
          {track.isLocal && (
            <View style={s`flex-row items-center mt-1`}>
              <Ionicons 
                name="phone-portrait" 
                size={12} 
                color={isDark ? '#6b7280' : '#9ca3af'} 
              />
              <Text style={s`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Local
              </Text>
            </View>
          )}
        </View>

        {/* Play Indicator */}
        {isCurrentTrack && (
          <View style={s`ml-2`}>
            <Ionicons 
              name="volume-high" 
              size={16} 
              color='#e05338' 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (safeTracks.length === 0) {
    return (
      <View style={s`flex-1 items-center justify-center px-6`}>
        <Ionicons 
          name="musical-notes" 
          size={64} 
          color={isDark ? '#4b5563' : '#9ca3af'} 
        />
        <Text style={s`text-lg font-semibold mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No tracks found
        </Text>
        <Text style={s`text-sm text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Your music library appears to be empty
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={safeTracks}
      renderItem={renderTrackItem}
      keyExtractor={(item) => item.id}
      style={s`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => (
        <View style={s`h-px ${isDark ? 'bg-gray-800' : 'bg-gray-100'} mx-4`} />
      )}
    />
  );
};