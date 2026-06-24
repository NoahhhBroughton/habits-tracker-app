import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/schema';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="habits.db" onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="add-habit" options={{ title: 'New habit', presentation: 'modal' }} />
          <Stack.Screen name="habit/[id]" options={{ title: '' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
