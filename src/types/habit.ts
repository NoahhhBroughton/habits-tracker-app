export type Habit = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  reminderHour: number | null;
  reminderMinute: number | null;
  notificationId: string | null;
};

export type HabitWithStats = Habit & {
  checkins: Set<string>;
  streak: number;
  doneToday: boolean;
};
