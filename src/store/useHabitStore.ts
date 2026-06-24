import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { todayKey } from '@/lib/date';
import { calculateStreak } from '@/lib/streak';
import type { FrequencyType, HabitReminder, HabitWithStats, TrackingType } from '@/types/habit';

type HabitRow = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
  position: number;
  tracking_type: TrackingType;
  target_value: number | null;
  unit: string | null;
  frequency_type: FrequencyType;
  frequency_days: string | null;
  sound_enabled: number;
};

type CheckinRow = { habit_id: number; date: string; value: number; note: string };
type ReminderRow = {
  id: number;
  habit_id: number;
  hour: number;
  minute: number;
  days: string | null;
  notification_id: string | null;
};

export type ReminderInput = { hour: number; minute: number; days: number[] | null; notificationIds: string[] };

type HabitInput = {
  name: string;
  emoji: string;
  color: string;
  trackingType: TrackingType;
  targetValue: number | null;
  unit: string | null;
  frequencyType: FrequencyType;
  frequencyDays: number[] | null;
  soundEnabled: boolean;
  reminders: ReminderInput[];
};

type HabitStore = {
  habits: HabitWithStats[];
  isLoading: boolean;
  refresh: (db: SQLiteDatabase) => Promise<void>;
  addHabit: (db: SQLiteDatabase, input: HabitInput) => Promise<void>;
  updateHabit: (db: SQLiteDatabase, habitId: number, input: HabitInput) => Promise<void>;
  toggleToday: (db: SQLiteDatabase, habitId: number) => Promise<void>;
  setTodayValue: (db: SQLiteDatabase, habitId: number, value: number) => Promise<void>;
  setNoteForDate: (db: SQLiteDatabase, habitId: number, date: string, note: string) => Promise<void>;
  deleteHabit: (db: SQLiteDatabase, habitId: number) => Promise<void>;
  reorderHabits: (db: SQLiteDatabase, orderedIds: number[]) => Promise<void>;
};

function parseDayList(raw: string | null): number[] | null {
  if (!raw) return null;
  return raw
    .split(',')
    .map((value) => parseInt(value, 10))
    .filter((value) => !Number.isNaN(value));
}

function parseNotificationIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return [raw];
  }
}

function buildHabitsWithStats(
  habitRows: HabitRow[],
  checkinRows: CheckinRow[],
  reminderRows: ReminderRow[]
): HabitWithStats[] {
  const valuesByHabit = new Map<number, Map<string, number>>();
  const notesByHabit = new Map<number, Map<string, string>>();
  for (const row of checkinRows) {
    const valueMap = valuesByHabit.get(row.habit_id) ?? new Map<string, number>();
    valueMap.set(row.date, row.value);
    valuesByHabit.set(row.habit_id, valueMap);

    if (row.note) {
      const noteMap = notesByHabit.get(row.habit_id) ?? new Map<string, string>();
      noteMap.set(row.date, row.note);
      notesByHabit.set(row.habit_id, noteMap);
    }
  }

  const remindersByHabit = new Map<number, HabitReminder[]>();
  for (const row of reminderRows) {
    const list = remindersByHabit.get(row.habit_id) ?? [];
    list.push({
      id: row.id,
      hour: row.hour,
      minute: row.minute,
      days: parseDayList(row.days),
      notificationIds: parseNotificationIds(row.notification_id),
    });
    remindersByHabit.set(row.habit_id, list);
  }

  const today = todayKey();

  return habitRows.map((row) => {
    const valueByDate = valuesByHabit.get(row.id) ?? new Map<string, number>();
    const notesByDate = notesByHabit.get(row.id) ?? new Map<string, string>();
    // For quantity habits, a day "counts" once the logged value reaches the
    // target; for boolean habits any logged value (always 1) counts.
    const goal = row.tracking_type === 'quantity' ? row.target_value ?? 1 : 1;

    const completedDates = new Set<string>();
    for (const [date, value] of valueByDate) {
      if (value >= goal) completedDates.add(date);
    }

    const todayValue = valueByDate.get(today) ?? 0;
    const frequencyDays = parseDayList(row.frequency_days);

    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      createdAt: row.created_at,
      position: row.position,
      trackingType: row.tracking_type,
      targetValue: row.target_value,
      unit: row.unit,
      frequencyType: row.frequency_type,
      frequencyDays,
      soundEnabled: row.sound_enabled === 1,
      valueByDate,
      notesByDate,
      completedDates,
      reminders: (remindersByHabit.get(row.id) ?? []).sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
      streak: calculateStreak(completedDates, { type: row.frequency_type, days: frequencyDays }),
      todayValue,
      doneToday: todayValue >= goal,
    };
  });
}

async function replaceReminders(db: SQLiteDatabase, habitId: number, reminders: ReminderInput[]) {
  await db.runAsync('DELETE FROM habit_reminders WHERE habit_id = $habitId', { $habitId: habitId });
  for (const reminder of reminders) {
    await db.runAsync(
      'INSERT INTO habit_reminders (habit_id, hour, minute, days, notification_id) VALUES ($habitId, $hour, $minute, $days, $notificationId)',
      {
        $habitId: habitId,
        $hour: reminder.hour,
        $minute: reminder.minute,
        $days: reminder.days && reminder.days.length > 0 ? reminder.days.join(',') : null,
        $notificationId: JSON.stringify(reminder.notificationIds),
      }
    );
  }
}

// Drops a checkin row once it carries no information (no progress logged
// and no note attached) so empty rows don't linger in the table.
async function pruneEmptyCheckin(db: SQLiteDatabase, habitId: number, date: string) {
  await db.runAsync(
    "DELETE FROM checkins WHERE habit_id = $habitId AND date = $date AND value <= 0 AND (note IS NULL OR note = '')",
    { $habitId: habitId, $date: date }
  );
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  isLoading: true,

  refresh: async (db) => {
    const [habitRows, checkinRows, reminderRows] = await Promise.all([
      db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY position ASC, created_at ASC'),
      db.getAllAsync<CheckinRow>('SELECT habit_id, date, value, note FROM checkins'),
      db.getAllAsync<ReminderRow>('SELECT * FROM habit_reminders'),
    ]);
    set({ habits: buildHabitsWithStats(habitRows, checkinRows, reminderRows), isLoading: false });
  },

  addHabit: async (
    db,
    { name, emoji, color, trackingType, targetValue, unit, frequencyType, frequencyDays, soundEnabled, reminders }
  ) => {
    const result = await db.runAsync(
      `INSERT INTO habits (name, emoji, color, created_at, tracking_type, target_value, unit, frequency_type, frequency_days, sound_enabled, position)
       VALUES ($name, $emoji, $color, $createdAt, $trackingType, $targetValue, $unit, $frequencyType, $frequencyDays, $soundEnabled,
         (SELECT COALESCE(MAX(position), -1) + 1 FROM habits))`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $createdAt: new Date().toISOString(),
        $trackingType: trackingType,
        $targetValue: targetValue,
        $unit: unit,
        $frequencyType: frequencyType,
        $frequencyDays: frequencyDays && frequencyDays.length > 0 ? frequencyDays.join(',') : null,
        $soundEnabled: soundEnabled ? 1 : 0,
      }
    );
    await replaceReminders(db, result.lastInsertRowId, reminders);
    await useHabitStore.getState().refresh(db);
  },

  updateHabit: async (
    db,
    habitId,
    { name, emoji, color, trackingType, targetValue, unit, frequencyType, frequencyDays, soundEnabled, reminders }
  ) => {
    await db.runAsync(
      `UPDATE habits SET name = $name, emoji = $emoji, color = $color,
         tracking_type = $trackingType, target_value = $targetValue, unit = $unit,
         frequency_type = $frequencyType, frequency_days = $frequencyDays, sound_enabled = $soundEnabled
       WHERE id = $habitId`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $trackingType: trackingType,
        $targetValue: targetValue,
        $unit: unit,
        $frequencyType: frequencyType,
        $frequencyDays: frequencyDays && frequencyDays.length > 0 ? frequencyDays.join(',') : null,
        $soundEnabled: soundEnabled ? 1 : 0,
        $habitId: habitId,
      }
    );
    await replaceReminders(db, habitId, reminders);
    await useHabitStore.getState().refresh(db);
  },

  toggleToday: async (db, habitId) => {
    const today = todayKey();
    const existing = await db.getFirstAsync<{ value: number }>(
      'SELECT value FROM checkins WHERE habit_id = $habitId AND date = $date',
      { $habitId: habitId, $date: today }
    );
    const isDone = (existing?.value ?? 0) > 0;
    await db.runAsync(
      `INSERT INTO checkins (habit_id, date, value) VALUES ($habitId, $date, $value)
       ON CONFLICT(habit_id, date) DO UPDATE SET value = $value`,
      { $habitId: habitId, $date: today, $value: isDone ? 0 : 1 }
    );
    await pruneEmptyCheckin(db, habitId, today);
    await useHabitStore.getState().refresh(db);
  },

  setTodayValue: async (db, habitId, value) => {
    const today = todayKey();
    const safeValue = Math.max(0, value);
    await db.runAsync(
      `INSERT INTO checkins (habit_id, date, value) VALUES ($habitId, $date, $value)
       ON CONFLICT(habit_id, date) DO UPDATE SET value = $value`,
      { $habitId: habitId, $date: today, $value: safeValue }
    );
    await pruneEmptyCheckin(db, habitId, today);
    await useHabitStore.getState().refresh(db);
  },

  setNoteForDate: async (db, habitId, date, note) => {
    await db.runAsync(
      `INSERT INTO checkins (habit_id, date, value, note) VALUES ($habitId, $date, 0, $note)
       ON CONFLICT(habit_id, date) DO UPDATE SET note = $note`,
      { $habitId: habitId, $date: date, $note: note.trim() }
    );
    await pruneEmptyCheckin(db, habitId, date);
    await useHabitStore.getState().refresh(db);
  },

  deleteHabit: async (db, habitId) => {
    await db.runAsync('DELETE FROM habits WHERE id = $habitId', { $habitId: habitId });
    await useHabitStore.getState().refresh(db);
  },

  reorderHabits: async (db, orderedIds) => {
    set((state) => {
      const habitsById = new Map(state.habits.map((habit) => [habit.id, habit]));
      const reordered = orderedIds
        .map((id) => habitsById.get(id))
        .filter((habit): habit is HabitWithStats => habit != null);
      return { habits: reordered };
    });
    await Promise.all(
      orderedIds.map((id, index) =>
        db.runAsync('UPDATE habits SET position = $position WHERE id = $id', { $position: index, $id: id })
      )
    );
  },
}));
