import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { HabitForm, type HabitFormValues } from '@/components/habit-form';
import { requestNotificationPermission, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore, type ReminderInput } from '@/store/useHabitStore';

export default function AddHabitScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const addHabit = useHabitStore((state) => state.addHabit);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(values: HabitFormValues) {
    setIsSaving(true);

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

    await addHabit(db, {
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

  return <HabitForm submitLabel="Save habit" isSubmitting={isSaving} onSubmit={handleSubmit} />;
}
