import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
  return requestedStatus === 'granted';
}

export async function scheduleHabitReminder(
  habitName: string,
  hour: number,
  minute: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit reminder',
      body: `Time to: ${habitName}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelHabitReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
