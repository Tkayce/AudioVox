import { setAudioModeAsync } from 'expo-audio';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioStatusBridge } from '../hooks/useLocalAudio';
import { useAudioStore } from '../store/audioStore';
// import '../global.css';

export default function RootLayout() {
  const isDarkMode = useAudioStore((state) => state.isDarkMode);
  
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
        // Error setting audio mode
      }
    })();
  }, []);
  
  return (
    <SafeAreaProvider>
      <AudioStatusBridge />
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
