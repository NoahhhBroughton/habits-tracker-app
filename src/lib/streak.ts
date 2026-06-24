import { subDays, subWeeks, startOfWeek } from 'date-fns';

import { parseDateKey, toDateKey } from '@/lib/date';
import { isScheduledDay, type Frequency } from '@/lib/frequency';

export type { Frequency };

// Safety bound so a misconfigured frequency (e.g. specific_days with no
// days selected) can't spin the backward walk forever.
const MAX_WALK_DAYS = 3650;

function calculateWeeklyStreak(completedDates: Set<string>, today: Date): number {
  const weeksWithCompletion = new Set<string>();
  for (const dateKey of completedDates) {
    weeksWithCompletion.add(toDateKey(startOfWeek(parseDateKey(dateKey))));
  }

  let cursor = startOfWeek(today);
  // Don't zero the streak just because this week isn't done yet — the week isn't over.
  if (!weeksWithCompletion.has(toDateKey(cursor))) {
    cursor = subWeeks(cursor, 1);
  }

  let streak = 0;
  let guard = 0;
  while (weeksWithCompletion.has(toDateKey(cursor)) && guard < MAX_WALK_DAYS) {
    streak++;
    cursor = subWeeks(cursor, 1);
    guard++;
  }
  return streak;
}

// A streak that hasn't been broken yet shouldn't drop to 0 just because
// today's checkbox isn't ticked yet, so we start counting from yesterday
// when today is still an open, scheduled day.
export function calculateStreak(
  completedDates: Set<string>,
  frequency: Frequency = { type: 'daily', days: null },
  today = new Date()
): number {
  if (frequency.type === 'weekly') {
    return calculateWeeklyStreak(completedDates, today);
  }

  let cursor = today;
  if (isScheduledDay(cursor, frequency) && !completedDates.has(toDateKey(cursor))) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  let guard = 0;
  while (guard < MAX_WALK_DAYS) {
    if (isScheduledDay(cursor, frequency)) {
      if (completedDates.has(toDateKey(cursor))) {
        streak++;
      } else {
        break;
      }
    }
    cursor = subDays(cursor, 1);
    guard++;
  }
  return streak;
}
