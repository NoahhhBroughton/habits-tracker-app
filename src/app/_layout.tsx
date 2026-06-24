import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/schema';
import { useActiveColorScheme, useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/store/useSettingsStore';

function RootLayoutContent() {
  const db = useSQLiteContext();
  const colorScheme = useActiveColorScheme();
  const theme = useTheme();
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadSettings(db);
  }, [db, loadSettings]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="add-habit" options={{ title: 'New habit', presentation: 'modal' }} />
          <Stack.Screen name="habit/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="habit/[id]/edit" options={{ title: 'Edit habit', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="habits.db" onInit={migrateDbIfNeeded}>
      <RootLayoutContent />
    </SQLiteProvider>
  );
}
