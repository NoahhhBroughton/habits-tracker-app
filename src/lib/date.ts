import { format } from 'date-fns';

export const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const todayKey = () => toDateKey(new Date());
