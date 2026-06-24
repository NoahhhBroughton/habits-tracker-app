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
        const notificationId = granted
          ? await scheduleHabitReminder(values.name, reminder.hour, reminder.minute)
          : null;
        reminders.push({ hour: reminder.hour, minute: reminder.minute, notificationId });
      }
    }

    await addHabit(db, {
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

  return <HabitForm submitLabel="Save habit" isSubmitting={isSaving} onSubmit={handleSubmit} />;
}
