import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { todayKey } from '@/lib/date';
import { calculateStreak } from '@/lib/streak';
import type { HabitWithStats } from '@/types/habit';

type HabitRow = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
  reminder_hour: number | null;
  reminder_minute: number | null;
  notification_id: string | null;
};

type CheckinRow = { habit_id: number; date: string };

export type Reminder = { hour: number; minute: number; notificationId: string } | null;

type HabitStore = {
  habits: HabitWithStats[];
  isLoading: boolean;
  refresh: (db: SQLiteDatabase) => Promise<void>;
  addHabit: (
    db: SQLiteDatabase,
    input: { name: string; emoji: string; color: string; reminder: Reminder }
  ) => Promise<void>;
  updateHabit: (
    db: SQLiteDatabase,
    habitId: number,
    input: { name: string; emoji: string; color: string; reminder: Reminder }
  ) => Promise<void>;
  toggleToday: (db: SQLiteDatabase, habitId: number) => Promise<void>;
  deleteHabit: (db: SQLiteDatabase, habitId: number) => Promise<void>;
};

function buildHabitsWithStats(habitRows: HabitRow[], checkinRows: CheckinRow[]): HabitWithStats[] {
  const checkinsByHabit = new Map<number, Set<string>>();
  for (const row of checkinRows) {
    const set = checkinsByHabit.get(row.habit_id) ?? new Set<string>();
    set.add(row.date);
    checkinsByHabit.set(row.habit_id, set);
  }

  const today = todayKey();
  return habitRows.map((row) => {
    const checkins = checkinsByHabit.get(row.id) ?? new Set<string>();
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      createdAt: row.created_at,
      reminderHour: row.reminder_hour,
      reminderMinute: row.reminder_minute,
      notificationId: row.notification_id,
      checkins,
      streak: calculateStreak(checkins),
      doneToday: checkins.has(today),
    };
  });
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  isLoading: true,

  refresh: async (db) => {
    const [habitRows, checkinRows] = await Promise.all([
      db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY created_at ASC'),
      db.getAllAsync<CheckinRow>('SELECT habit_id, date FROM checkins'),
    ]);
    set({ habits: buildHabitsWithStats(habitRows, checkinRows), isLoading: false });
  },

  addHabit: async (db, { name, emoji, color, reminder }) => {
    await db.runAsync(
      `INSERT INTO habits (name, emoji, color, created_at, reminder_hour, reminder_minute, notification_id)
       VALUES ($name, $emoji, $color, $createdAt, $hour, $minute, $notificationId)`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $createdAt: new Date().toISOString(),
        $hour: reminder?.hour ?? null,
        $minute: reminder?.minute ?? null,
        $notificationId: reminder?.notificationId ?? null,
      }
    );
    await useHabitStore.getState().refresh(db);
  },

  updateHabit: async (db, habitId, { name, emoji, color, reminder }) => {
    await db.runAsync(
      `UPDATE habits SET name = $name, emoji = $emoji, color = $color,
         reminder_hour = $hour, reminder_minute = $minute, notification_id = $notificationId
       WHERE id = $habitId`,
      {
        $name: name,
        $emoji: emoji,
        $color: color,
        $hour: reminder?.hour ?? null,
        $minute: reminder?.minute ?? null,
        $notificationId: reminder?.notificationId ?? null,
        $habitId: habitId,
      }
    );
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
      await db.runAsync('INSERT INTO checkins (habit_id, date) VALUES ($habitId, $date)', {
        $habitId: habitId,
        $date: today,
      });
    }
    await useHabitStore.getState().refresh(db);
  },

  deleteHabit: async (db, habitId) => {
    await db.runAsync('DELETE FROM habits WHERE id = $habitId', { $habitId: habitId });
    await useHabitStore.getState().refresh(db);
  },

  setReminder: async (db, habitId, reminder) => {
    await db.runAsync(
      'UPDATE habits SET reminder_hour = $hour, reminder_minute = $minute, notification_id = $notificationId WHERE id = $habitId',
      {
        $hour: reminder?.hour ?? null,
        $minute: reminder?.minute ?? null,
        $notificationId: reminder?.notificationId ?? null,
        $habitId: habitId,
      }
    );
    await useHabitStore.getState().refresh(db);
  },
}));
