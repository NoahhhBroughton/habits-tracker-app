import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestNotificationPermission } from '@/lib/notifications';
import { useSettingsStore, type ThemePreference } from '@/store/useSettingsStore';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { themePreference, setThemePreference } = useSettingsStore();
  const [notificationStatus, setNotificationStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((result) => setNotificationStatus(result.status));
  }, []);

  async function handleNotificationRowPress() {
    if (notificationStatus === 'granted') {
      Linking.openSettings();
      return;
    }
    const granted = await requestNotificationPermission();
    const result = await Notifications.getPermissionsAsync();
    setNotificationStatus(result.status);
    if (!granted) {
      Linking.openSettings();
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Appearance
      </ThemedText>
      <ThemedView style={styles.row}>
        {THEME_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setThemePreference(db, option.value)}
            style={[
              styles.themeOption,
              {
                backgroundColor:
                  themePreference === option.value ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText>{option.label}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Notifications
      </ThemedText>
      <Pressable
        onPress={handleNotificationRowPress}
        style={[styles.notificationRow, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText>{notificationStatus === 'granted' ? 'Notifications are on' : 'Notifications are off'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {notificationStatus === 'granted' ? 'Tap to manage in system settings' : 'Tap to allow habit reminders'}
        </ThemedText>
      </Pressable>

      <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
        Habit Tracker v{Constants.expoConfig?.version ?? '1.0.0'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.five,
  },
  notificationRow: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    gap: 4,
  },
  version: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
});
