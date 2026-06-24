import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { HabitForm, type HabitFormValues } from '@/components/habit-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { cancelHabitReminder, requestNotificationPermission, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore, type ReminderInput } from '@/store/useHabitStore';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const { habits, updateHabit } = useHabitStore();
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

    await Promise.all(
      target.reminders
        .filter((reminder) => reminder.notificationId)
        .map((reminder) => cancelHabitReminder(reminder.notificationId!))
    );

    const reminders: ReminderInput[] = [];
    if (values.reminders.length > 0) {
      const granted = await requestNotificationPermission();
      for (const reminder of values.reminders) {
        const notificationId = granted
          ? await scheduleHabitReminder(values.name, reminder.hour, reminder.minute)
          : null;
        reminders.push({ hour: reminder.hour, minute: reminder.minute, notificationId });
      }
    }

    await updateHabit(db, target.id, {
      name: values.name,
      emoji: values.emoji,
      color: values.color,
      trackingType: values.trackingType,
      targetValue: values.targetValue,
      unit: values.unit,
      reminders,
    });
    router.back();
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
        reminders: habit.reminders.map((reminder) => ({ hour: reminder.hour, minute: reminder.minute })),
      }}
      onSubmit={handleSubmit}
    />
  );
}
