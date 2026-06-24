export type TrackingType = 'boolean' | 'quantity';

export type HabitReminder = {
  id: number;
  hour: number;
  minute: number;
  notificationId: string | null;
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
};

export type HabitWithStats = Habit & {
  valueByDate: Map<string, number>;
  completedDates: Set<string>;
  reminders: HabitReminder[];
  streak: number;
  todayValue: number;
  doneToday: boolean;
};
