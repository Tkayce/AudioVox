import { setAudioModeAsync } from 'expo-audio';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAudioStore } from '../store/audioStore';
// import '../global.css';

export default function RootLayout() {
  const { isDarkMode } = useAudioStore();
  
  // Enable background audio playback for the whole app
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.log('Error setting audio mode:', error);
      }
    })();
  }, []);
  
  return (
    <SafeAreaProvider>
      <View style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? '#111827' : '#ffffff' 
      }}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
