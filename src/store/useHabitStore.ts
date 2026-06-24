import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { todayKey } from '@/lib/date';
import { calculateStreak } from '@/lib/streak';
import type { HabitReminder, HabitWithStats, TrackingType } from '@/types/habit';

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
};

type CheckinRow = { habit_id: number; date: string; value: number };
type ReminderRow = { id: number; habit_id: number; hour: number; minute: number; notification_id: string | null };

export type ReminderInput = { hour: number; minute: number; notificationId: string | null };

type HabitInput = {
  name: string;
  emoji: string;
  color: string;
  trackingType: TrackingType;
  targetValue: number | null;
  unit: string | null;
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
  deleteHabit: (db: SQLiteDatabase, habitId: number) => Promise<void>;
  reorderHabits: (db: SQLiteDatabase, orderedIds: number[]) => Promise<void>;
};

function buildHabitsWithStats(
  habitRows: HabitRow[],
  checkinRows: CheckinRow[],
  reminderRows: ReminderRow[]
): HabitWithStats[] {
  const valuesByHabit = new Map<number, Map<string, number>>();
  for (const row of checkinRows) {
    const map = valuesByHabit.get(row.habit_id) ?? new Map<string, number>();
    map.set(row.date, row.value);
    valuesByHabit.set(row.habit_id, map);
  }

  const remindersByHabit = new Map<number, HabitReminder[]>();
  for (const row of reminderRows) {
    const list = remindersByHabit.get(row.habit_id) ?? [];
    list.push({ id: row.id, hour: row.hour, minute: row.minute, notificationId: row.notification_id });
    remindersByHabit.set(row.habit_id, list);
  }

  const today = todayKey();

  return habitRows.map((row) => {
    const valueByDate = valuesByHabit.get(row.id) ?? new Map<string, number>();
    // For quantity habits, a day "counts" once the logged value reaches the
    // target; for boolean habits any logged value (always 1) counts.
    const goal = row.tracking_type === 'quantity' ? row.target_value ?? 1 : 1;

    const completedDates = new Set<string>();
    for (const [date, value] of valueByDate) {
      if (value >= goal) completedDates.add(date);
    }

    const todayValue = valueByDate.get(today) ?? 0;

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
      valueByDate,
      completedDates,
      reminders: (remindersByHabit.get(row.id) ?? []).sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
      streak: calculateStreak(completedDates),
      todayValue,
      doneToday: todayValue >= goal,
    };
  });
}

async function replaceReminders(db: SQLiteDatabase, habitId: number, reminders: ReminderInput[]) {
  await db.runAsync('DELETE FROM habit_reminders WHERE habit_id = $habitId', { $habitId: habitId });
  for (const reminder of reminders) {
    await db.runAsync(
      'INSERT INTO habit_reminders (habit_id, hour, minute, notification_id) VALUES ($habitId, $hour, $minute, $notificationId)',
      { $habitId: habitId, $hour: reminder.hour, $minute: reminder.minute, $notificationId: reminder.notificationId }
    );
  }
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  isLoading: true,

  refresh: async (db) => {
    const [habitRows, checkinRows, reminderRows] = await Promise.all([
      db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY position ASC, created_at ASC'),
      db.getAllAsync<CheckinRow>('SELECT habit_id, date, value FROM checkins'),
      db.getAllAsync<ReminderRow>('SELECT * FROM habit_reminders'),
    ]);
    set({ habits: buildHabitsWithStats(habitRows, checkinRows, reminderRows), isLoading: false });
  },

  addHabit: async (db, { name, emoji, color, trackingType, targetValue, unit, reminders }) => {
    const result = await db.runAsync(
      `INSERT INTO habits (name, emoji, color, created_at, tracking_type, target_value, unit, position)
       VALUES ($name, $emoji, $color, $createdAt, $trackingType, $targetValue, $unit,
         (SELECT COALESCE(MAX(position), -1) + 1 FROM habits))`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $createdAt: new Date().toISOString(),
        $trackingType: trackingType,
        $targetValue: targetValue,
        $unit: unit,
      }
    );
    await replaceReminders(db, result.lastInsertRowId, reminders);
    await useHabitStore.getState().refresh(db);
  },

  updateHabit: async (db, habitId, { name, emoji, color, trackingType, targetValue, unit, reminders }) => {
    await db.runAsync(
      `UPDATE habits SET name = $name, emoji = $emoji, color = $color,
         tracking_type = $trackingType, target_value = $targetValue, unit = $unit
       WHERE id = $habitId`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $trackingType: trackingType,
        $targetValue: targetValue,
        $unit: unit,
        $habitId: habitId,
      }
    );
    await replaceReminders(db, habitId, reminders);
    await useHabitStore.getState().refresh(db);
  },

  toggleToday: async (db, habitId) => {
    const today = todayKey();
    const existing = await db.getFirstAsync(
      'SELECT id FROM checkins WHERE habit_id = $habitId AND date = $date',
      { $habitId: habitId, $date: today }
    );
    if (existing) {
      await db.runAsync('DELETE FROM checkins WHERE habit_id = $habitId AND date = $date', {
        $habitId: habitId,
        $date: today,
      });
    } else {
      await db.runAsync('INSERT INTO checkins (habit_id, date, value) VALUES ($habitId, $date, 1)', {
        $habitId: habitId,
        $date: today,
      });
    }
    await useHabitStore.getState().refresh(db);
  },

  setTodayValue: async (db, habitId, value) => {
    const today = todayKey();
    if (value <= 0) {
      await db.runAsync('DELETE FROM checkins WHERE habit_id = $habitId AND date = $date', {
        $habitId: habitId,
        $date: today,
      });
    } else {
      await db.runAsync(
        `INSERT INTO checkins (habit_id, date, value) VALUES ($habitId, $date, $value)
         ON CONFLICT(habit_id, date) DO UPDATE SET value = $value`,
        { $habitId: habitId, $date: today, $value: value }
      );
    }
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
