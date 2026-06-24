import { subDays } from 'date-fns';

import { toDateKey } from '@/lib/date';

// A streak that hasn't been broken yet shouldn't drop to 0 just because
// today's checkbox isn't ticked yet, so we start counting from yesterday
// when today is still open.
export function calculateStreak(checkins: Set<string>, today = new Date()): number {
  let cursor = today;
  if (!checkins.has(toDateKey(cursor))) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while (checkins.has(toDateKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
