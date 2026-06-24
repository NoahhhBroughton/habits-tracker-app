import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SOUND_CHANNEL_ID = 'habit-reminders-sound';
const SILENT_CHANNEL_ID = 'habit-reminders-silent';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: Boolean(notification.request.content.sound),
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync(SOUND_CHANNEL_ID, {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
    name: 'Habit reminders (silent)',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
  return requestedStatus === 'granted';
}

// `days` uses JS Date.getDay() convention (0 = Sunday .. 6 = Saturday).
// null/empty means "every day". expo-notifications' WEEKLY trigger wants
// weekday 1-7 with Sunday = 1, so each selected day becomes its own
// scheduled notification — that's why this returns an array of ids.
export async function scheduleHabitReminder(
  habitName: string,
  hour: number,
  minute: number,
  days: number[] | null,
  soundEnabled: boolean
): Promise<string[]> {
  const channelId = soundEnabled ? SOUND_CHANNEL_ID : SILENT_CHANNEL_ID;
  const content = {
    title: 'Habit reminder',
    body: `Time to: ${habitName}`,
    sound: soundEnabled ? true : undefined,
  };

  if (!days || days.length === 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
    });
    return [id];
  }

  return Promise.all(
    days.map((day) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
          hour,
          minute,
          channelId,
        },
      })
    )
  );
}

export async function cancelHabitReminder(notificationIds: string | string[]): Promise<void> {
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
