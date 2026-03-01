import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from 'react-native-wind';
import { TrackList } from '../components/TrackList';
import { Track, useAudioStore } from '../store/audioStore';

export const LibraryScreen: React.FC = () => {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useAudioStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus>();
  const [usingDemoMode, setUsingDemoMode] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'all' | 'worship' | 'study' | 'chill' | 'workout'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Demo tracks using actual audio files from assets
  const demoTracks: Track[] = [
    {
      id: 'asset-1',
      title: 'Holy',
      artist: 'Demo Track',
      duration: 270000, // Estimated 4.5 minutes
      uri: require('../assets/images/audio/Holy.mp3'),
      isLocal: false,
      mood: 'worship',
    },
    {
      id: 'asset-2', 
      title: 'Miracle',
      artist: 'Demo Track',
      duration: 320000, // Estimated 5.3 minutes
      uri: require('../assets/images/audio/Miracle.mp3'),
      isLocal: false,
      mood: 'worship',
    },
    {
      id: 'asset-3',
      title: 'Way Maker', 
      artist: 'Demo Track',
      duration: 380000, // Estimated 6.3 minutes
      uri: require('../assets/images/audio/WayMaker.mp3'),
      isLocal: false,
      mood: 'worship',
    }
  ];

  useEffect(() => {
    requestPermissionAndLoadTracks();
  }, []);

  const requestPermissionAndLoadTracks = async () => {
    try {
      setIsLoading(true);
      
      // Request media library permission
      let permission = await MediaLibrary.getPermissionsAsync();
      
      if (permission.status !== 'granted') {
        permission = await MediaLibrary.requestPermissionsAsync();
      }

      setPermissionStatus(permission.status);

      if (permission.status === 'granted') {
        await loadMusicFiles();
      } else {
        Alert.alert(
          'Permission Required',
          'AudioVox needs access to your music library to display your local audio files.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: requestPermissionAndLoadTracks }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setIsLoading(false);
      
      // Fall back to demo tracks when media library fails
      Alert.alert(
        'Media Library Unavailable',
        'Cannot access device media library (Expo Go limitation on Android). Loading bundled audio tracks instead.',
        [
          { 
            text: 'Use Bundled Tracks', 
            onPress: () => {
              setTracks(demoTracks);
              setUsingDemoMode(true);
              setPermissionStatus('demo-mode' as any);
            }
          }
        ]
      );
    }
  };

  const loadMusicFiles = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 100, // Limit to first 100 tracks for performance
        sortBy: ['creationTime'],
      });

      const audioTracks: Track[] = await Promise.all(
        media.assets.map(async (asset) => {
          // Get asset info for duration
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          
          return {
            id: asset.id,
            title: asset.filename.replace(/\.[^/.]+$/, ''), // Remove file extension
            artist: 'Unknown Artist', // MediaLibrary doesn't provide artist info easily
            duration: (asset.duration || 0) * 1000, // Convert to milliseconds
            uri: assetInfo.localUri || asset.uri,
            isLocal: true,
            mood: 'general',
          };
        })
      );

      setTracks(audioTracks);
    } catch (error) {
      console.error('Error loading music files:', error);
      Alert.alert(
        'Error',
        'Failed to load music files from your device. Please try again.'
      );
    }
  };

  const moods: { id: 'all' | 'worship' | 'study' | 'chill' | 'workout'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'worship', label: 'Worship' },
    { id: 'study', label: 'Study' },
    { id: 'chill', label: 'Chill' },
    { id: 'workout', label: 'Workout' },
  ];

  const filteredTracks = tracks.filter((track) => {
    // Mood filter first
    if (selectedMood !== 'all' && track.mood !== selectedMood) {
      return false;
    }

    // Then apply search query (title or artist)
    if (!searchQuery.trim()) {
      return true;
    }

    const q = searchQuery.trim().toLowerCase();
    const title = track.title?.toLowerCase() ?? '';
    const artist = track.artist?.toLowerCase() ?? '';
    return title.includes(q) || artist.includes(q);
  });

  const handleRefresh = () => {
    if (permissionStatus === 'granted') {
      loadMusicFiles();
    } else if (usingDemoMode) {
      setTracks(demoTracks);
    } else {
      requestPermissionAndLoadTracks();
    }
  };

  const renderPermissionView = () => (
    <View style={s`flex-1 items-center justify-center px-6`}>
      <Ionicons 
        name="lock-closed" 
        size={64} 
        color={isDarkMode ? '#4b5563' : '#9ca3af'} 
      />
      <Text style={s`text-xl font-semibold text-center mt-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Media Library Access Required
      </Text>
      <Text style={s`text-base text-center mt-2 mb-6 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        AudioVox needs permission to access your music library to show local audio files.
      </Text>
      <TouchableOpacity
        onPress={requestPermissionAndLoadTracks}
        style={[s`px-6 py-3 rounded-lg`, { backgroundColor: '#e05338' }]}
      >
        <Text style={s`text-white font-semibold`}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingView = () => (
    <View style={s`flex-1 items-center justify-center`}>
      <ActivityIndicator 
        size="large" 
        color='#e05338' 
      />
      <Text style={s`text-base mt-4 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Loading your music library...
      </Text>
    </View>
  );

  return (
    <SafeAreaView 
      style={s`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#ffffff'}
      />

      {/* Header */}
      <View style={s`flex-row items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700`}>
        <View style={s`flex-row items-center`}>
          <Ionicons 
            name="library" 
            size={24} 
            color='#e05338' 
          />
          <Text style={s`text-xl font-bold ml-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Your Library {usingDemoMode && '(Demo)'}
          </Text>
        </View>
        
        <View style={s`flex-row items-center space-x-2`}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={s`p-2 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={isDarkMode ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
          
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
      </View>

      {/* Content */}
      {isLoading ? (
        renderLoadingView()
      ) : (permissionStatus !== 'granted' && !usingDemoMode) ? (
        renderPermissionView()
      ) : (
        <>
          {/* Track Count */}
          {tracks.length > 0 && (
            <View style={s`px-6 py-3`}>
              <Text style={s`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {tracks.length} {usingDemoMode ? 'bundled audio ' : ''}track{tracks.length !== 1 ? 's' : ''} {usingDemoMode ? 'available' : 'found'}
              </Text>
              {usingDemoMode && (
                <Text style={s`text-xs mt-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Bundled audio files for testing player functionality
                </Text>
              )}

              {/* Mood filter pills */}
              <View style={s`flex-row mt-3`}>
                {moods.map((mood) => {
                  const isActive = selectedMood === mood.id;
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      onPress={() => setSelectedMood(mood.id)}
                      style={s`mr-2 px-3 py-1 rounded-full ${
                        isActive
                          ? 'bg-orange-500'
                          : isDarkMode
                            ? 'bg-gray-800'
                            : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        style={s`text-xs font-semibold ${
                          isActive
                            ? 'text-white'
                            : isDarkMode
                              ? 'text-gray-200'
                              : 'text-gray-700'
                        }`}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search input */}
              <View style={s`mt-3`}> 
                <View
                  style={s`flex-row items-center px-3 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={isDarkMode ? '#9ca3af' : '#6b7280'}
                  />
                  <TextInput
                    placeholder="Search by title or artist"
                    placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={s`flex-1 ml-2 text-sm ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </View>
              </View>
            </View>
          )}
          
          {/* Track List */}
          <TrackList 
            tracks={filteredTracks}
            isDark={isDarkMode}
            onTrackSelect={(track, index) => {
              console.log(`Selected track: ${track.title} (navigating to Player tab)`);
              // Move user to the main Player tab so global controls are visible
              router.push('/(tabs)');
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
};