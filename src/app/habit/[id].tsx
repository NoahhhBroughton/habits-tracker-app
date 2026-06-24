import { Alert, Platform, Pressable, StyleSheet, Switch } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useLayoutEffect, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { HeatmapGrid } from '@/components/heatmap-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cancelHabitReminder, requestNotificationPermission, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore } from '@/store/useHabitStore';

const DEFAULT_REMINDER_HOUR = 9;
const DEFAULT_REMINDER_MINUTE = 0;

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const { habits, deleteHabit, setReminder } = useHabitStore();
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const habit = habits.find((item) => item.id === Number(id));

  useLayoutEffect(() => {
    if (habit) {
      navigation.setOptions({ title: `${habit.emoji} ${habit.name}` });
    }
  }, [habit, navigation]);

  if (!habit) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Habit not found.</ThemedText>
      </ThemedView>
    );
  }

  async function applyReminderTime(hour: number, minute: number) {
    if (!habit) return;
    if (habit.notificationId) {
      await cancelHabitReminder(habit.notificationId);
    }
    const notificationId = await scheduleHabitReminder(habit.name, hour, minute);
    await setReminder(db, habit.id, { hour, minute, notificationId });
  }

  async function handleToggleReminder(enabled: boolean) {
    if (!habit) return;
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in system settings to get reminders.');
        return;
      }
      await applyReminderTime(
        habit.reminderHour ?? DEFAULT_REMINDER_HOUR,
        habit.reminderMinute ?? DEFAULT_REMINDER_MINUTE
      );
    } else {
      if (habit.notificationId) {
        await cancelHabitReminder(habit.notificationId);
      }
      await setReminder(db, habit.id, null);
    }
  }

  function handleTimePickerChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setIsTimePickerVisible(false);
    }
    if (event.type === 'dismissed' || !selectedDate) return;
    applyReminderTime(selectedDate.getHours(), selectedDate.getMinutes());
  }

  function handleDelete() {
    if (!habit) return;
    const target = habit;
    Alert.alert('Delete habit', `Delete "${target.name}" and all its history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (target.notificationId) {
            await cancelHabitReminder(target.notificationId);
          }
          await deleteHabit(db, target.id);
          router.back();
        },
      },
    ]);
  }

  const reminderEnabled = habit.reminderHour != null;
  const pickerValue = new Date();
  pickerValue.setHours(habit.reminderHour ?? DEFAULT_REMINDER_HOUR, habit.reminderMinute ?? DEFAULT_REMINDER_MINUTE);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" themeColor="textSecondary">
        {habit.streak > 0 ? `🔥 ${habit.streak} day streak` : 'No streak yet — check in today to start one'}
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Consistency
      </ThemedText>
      <HeatmapGrid checkins={habit.checkins} color={habit.color} />

      <ThemedView style={styles.reminderRow}>
        <ThemedView>
          <ThemedText>Daily reminder</ThemedText>
          {reminderEnabled ? (
            <Pressable onPress={() => setIsTimePickerVisible(true)}>
              <ThemedText type="linkPrimary">
                {String(habit.reminderHour).padStart(2, '0')}:{String(habit.reminderMinute).padStart(2, '0')} · change
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Off
            </ThemedText>
          )}
        </ThemedView>
        <Switch value={reminderEnabled} onValueChange={handleToggleReminder} />
      </ThemedView>

      {isTimePickerVisible ? (
        <ThemedView style={styles.timePickerWrap}>
          <DateTimePicker mode="time" value={pickerValue} onChange={handleTimePickerChange} />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setIsTimePickerVisible(false)} style={styles.doneButton}>
              <ThemedText type="linkPrimary">Done</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      ) : null}

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <ThemedText style={{ color: '#ef4444' }}>Delete habit</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
  },
  timePickerWrap: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  doneButton: {
    paddingVertical: Spacing.two,
  },
  deleteButton: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
});
