import { format } from 'date-fns';

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const todayKey = () => toDateKey(new Date());

// `new Date('yyyy-MM-dd')` parses as UTC midnight, which can shift the date
// by a day depending on local timezone. Build it from local components instead.
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
