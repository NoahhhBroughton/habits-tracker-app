export type TrackingType = 'boolean' | 'quantity';

export type FrequencyType = 'daily' | 'weekly' | 'specific_days';

export type HabitReminder = {
  id: number;
  hour: number;
  minute: number;
  days: number[] | null;
  notificationIds: string[];
};

export type Habit = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  position: number;
  trackingType: TrackingType;
  targetValue: number | null;
  unit: string | null;
  frequencyType: FrequencyType;
  frequencyDays: number[] | null;
  soundEnabled: boolean;
};

export type HabitWithStats = Habit & {
  valueByDate: Map<string, number>;
  notesByDate: Map<string, string>;
  completedDates: Set<string>;
  reminders: HabitReminder[];
  streak: number;
  todayValue: number;
  // Sum of values across the habit's current actionable period: just
  // today's value for daily/specific_days, the whole week's for weekly.
  periodValue: number;
  doneToday: boolean;
};
