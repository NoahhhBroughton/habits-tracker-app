import { Alert, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useLayoutEffect } from 'react';

import { HeatmapGrid } from '@/components/heatmap-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cancelHabitReminder } from '@/lib/notifications';
import { useHabitStore } from '@/store/useHabitStore';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const { habits, deleteHabit } = useHabitStore();

  const habit = habits.find((item) => item.id === Number(id));

  useLayoutEffect(() => {
    if (habit) {
      navigation.setOptions({
        title: `${habit.emoji} ${habit.name}`,
        headerRight: () => (
          <Pressable onPress={() => router.push(`/habit/${habit.id}/edit`)}>
            <ThemedText type="linkPrimary">Edit</ThemedText>
          </Pressable>
        ),
      });
    }
  }, [habit, navigation, router]);

  if (!habit) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Habit not found.</ThemedText>
      </ThemedView>
    );
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
          await Promise.all(
            target.reminders
              .filter((reminder) => reminder.notificationId)
              .map((reminder) => cancelHabitReminder(reminder.notificationId!))
          );
          await deleteHabit(db, target.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" themeColor="textSecondary">
        {habit.streak > 0 ? `🔥 ${habit.streak} day streak` : 'No streak yet — check in today to start one'}
      </ThemedText>

      {habit.trackingType === 'quantity' ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          Today: {habit.todayValue} / {habit.targetValue} {habit.unit}
        </ThemedText>
      ) : null}

      {habit.reminders.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          {habit.reminders.length === 1
            ? `Reminder at ${String(habit.reminders[0].hour).padStart(2, '0')}:${String(habit.reminders[0].minute).padStart(2, '0')}`
            : `${habit.reminders.length} reminders a day`}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Consistency
      </ThemedText>
      <HeatmapGrid completedDates={habit.completedDates} color={habit.color} />

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
  deleteButton: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
});
