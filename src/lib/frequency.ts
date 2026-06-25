import { addDays, startOfWeek } from 'date-fns';

import { parseDateKey, toDateKey } from '@/lib/date';
import type { FrequencyType } from '@/types/habit';

export type Frequency = { type: FrequencyType; days: number[] | null };

export function isScheduledDay(date: Date, frequency: Frequency): boolean {
  if (frequency.type !== 'specific_days') return true;
  return frequency.days?.includes(date.getDay()) ?? true;
}

function weekDateKeys(date: Date): string[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

// The "actionable unit" a habit is checked off against: a single day for
// daily/specific_days, the whole Sun-Sat week for weekly habits.
export function getCurrentPeriodDateKeys(date: Date, frequencyType: FrequencyType): string[] {
  if (frequencyType !== 'weekly') return [toDateKey(date)];
  return weekDateKeys(date);
}

// A weekly completion is only stored against the single day it was tapped
// on, but it represents the whole week — expand each completed date out to
// every day in its Sun-Sat week (which can spill into the next/previous
// month) so calendar displays can show the full week as done.
export function expandCompletedDatesForDisplay(completedDates: Set<string>, frequencyType: FrequencyType): Set<string> {
  if (frequencyType !== 'weekly') return completedDates;
  const expanded = new Set<string>();
  for (const dateKey of completedDates) {
    for (const key of weekDateKeys(parseDateKey(dateKey))) expanded.add(key);
  }
  return expanded;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatFrequencyDays(days: number[] | null): string {
  if (!days || days.length === 0) return '';
  return [...days].sort((a, b) => a - b).map((day) => WEEKDAY_NAMES[day]).join(', ');
}

// Weekly habits are usually only checked off once per week, but counting raw
// completed days would overcount if someone logs more than once in a week —
// count distinct weeks instead so the lifetime total stays meaningful.
export function countTotalCompletions(completedDates: Set<string>, frequencyType: FrequencyType): number {
  if (frequencyType !== 'weekly') return completedDates.size;
  const weeks = new Set<string>();
  for (const date of completedDates) {
    weeks.add(toDateKey(startOfWeek(parseDateKey(date))));
  }
  return weeks.size;
}

export function totalCompletionsUnit(frequencyType: FrequencyType): 'day' | 'week' {
  return frequencyType === 'weekly' ? 'week' : 'day';
}
