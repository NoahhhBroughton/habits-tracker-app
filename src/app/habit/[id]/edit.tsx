import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ActionButton } from '@/components/action-button';
import { HabitForm, type HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cancelHabitReminder, requestNotificationPermission, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore, type ReminderInput } from '@/store/useHabitStore';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const { habits, updateHabit, deleteHabit } = useHabitStore();
  const [isSaving, setIsSaving] = useState(false);

  const habit = habits.find((item) => item.id === Number(id));

  if (!habit) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <ThemedText>Habit not found.</ThemedText>
      </ThemedView>
    );
  }

  const target = habit;

  async function handleSubmit(values: HabitFormValues) {
    setIsSaving(true);

    await Promise.all(target.reminders.map((reminder) => cancelHabitReminder(reminder.notificationIds)));

    const reminders: ReminderInput[] = [];
    if (values.reminders.length > 0) {
      const granted = await requestNotificationPermission();
      for (const reminder of values.reminders) {
        const notificationIds = granted
          ? await scheduleHabitReminder(values.name, reminder.hour, reminder.minute, reminder.days, values.soundEnabled)
          : [];
        reminders.push({ hour: reminder.hour, minute: reminder.minute, days: reminder.days, notificationIds });
      }
    }

    await updateHabit(db, target.id, {
      name: values.name,
      emoji: values.emoji,
      color: values.color,
      trackingType: values.trackingType,
      targetValue: values.targetValue,
      unit: values.unit,
      frequencyType: values.frequencyType,
      frequencyDays: values.frequencyDays,
      soundEnabled: values.soundEnabled,
      reminders,
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete habit', `Delete "${target.name}" and all its history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Promise.all(target.reminders.map((reminder) => cancelHabitReminder(reminder.notificationIds)));
          await deleteHabit(db, target.id);
          router.dismissAll();
        },
      },
    ]);
  }

  return (
    <HabitForm
      submitLabel="Save changes"
      isSubmitting={isSaving}
      initialValues={{
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        trackingType: habit.trackingType,
        targetValue: habit.targetValue,
        unit: habit.unit,
        frequencyType: habit.frequencyType,
        frequencyDays: habit.frequencyDays,
        soundEnabled: habit.soundEnabled,
        reminders: habit.reminders.map((reminder) => ({ hour: reminder.hour, minute: reminder.minute, days: reminder.days })),
      }}
      onSubmit={handleSubmit}
      footer={
        <ActionButton label="Delete habit" onPress={handleDelete} style={{ marginTop: Spacing.five, alignSelf: 'center' }} />
      }
    />
  );
}
