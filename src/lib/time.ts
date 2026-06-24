import * as Localization from 'expo-localization';

// Respects the device's actual 24-hour-clock setting (not just locale
// defaults) so reminder times read the way the rest of the OS does.
export function formatReminderTime(hour: number, minute: number): string {
  const uses24HourClock = Localization.getCalendars()[0]?.uses24hourClock ?? false;
  const paddedMinute = String(minute).padStart(2, '0');

  if (uses24HourClock) {
    return `${String(hour).padStart(2, '0')}:${paddedMinute}`;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${paddedMinute} ${period}`;
}
