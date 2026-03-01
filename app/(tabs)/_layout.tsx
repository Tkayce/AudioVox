import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAudioStore } from '../../store/audioStore';

export default function TabLayout() {
  const isDarkMode = useAudioStore((state) => state.isDarkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#e05338',
        tabBarInactiveTintColor: isDarkMode ? '#6b7280' : '#9ca3af',
        tabBarStyle: {
          // Use full black in dark mode for a true dark look,
          // and match the light background in light mode.
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          borderTopColor: isDarkMode ? '#000000' : '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 120,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Player',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}