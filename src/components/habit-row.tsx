import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatFrequencyDays, isScheduledDay } from '@/lib/frequency';
import type { HabitWithStats } from '@/types/habit';

type Props = {
  habit: HabitWithStats;
  onPress: () => void;
  onPressAction: () => void;
  onLongPress?: () => void;
};

export function HabitRow({ habit, onPress, onPressAction, onLongPress }: Props) {
  const theme = useTheme();
  const isQuantity = habit.trackingType === 'quantity';
  const isDone = habit.doneToday;
  const isScheduledToday = isScheduledDay(new Date(), { type: habit.frequencyType, days: habit.frequencyDays });
  const textColor = isDone ? '#ffffff' : theme.text;
  const secondaryTextColor = isDone ? 'rgba(255,255,255,0.85)' : theme.textSecondary;
  const actionBackground = isDone ? 'rgba(255,255,255,0.25)' : theme.backgroundSelected;

  const streakUnit = habit.frequencyType === 'weekly' ? 'week' : 'day';
  let subtitle = habit.streak > 0 ? `🔥 ${habit.streak} ${streakUnit}${habit.streak === 1 ? '' : 's'} streak` : 'No streak yet';
  if (habit.frequencyType === 'specific_days' && habit.frequencyDays) {
    subtitle += ` · ${formatFrequencyDays(habit.frequencyDays)}`;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: isDone ? habit.color : theme.backgroundElement,
        borderRadius: 12,
      }}
    >
      <ThemedText style={{ fontSize: 24 }}>{habit.emoji}</ThemedText>

      <View style={{ flex: 1 }}>
        <ThemedText type="default" style={{ color: textColor }}>
          {habit.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: secondaryTextColor }}>
          {subtitle}
        </ThemedText>
      </View>

      {isQuantity ? (
        <Pressable
          onPress={onPressAction}
          disabled={!isScheduledToday}
          style={{
            minWidth: 56,
            height: 32,
            borderRadius: 16,
            paddingHorizontal: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: actionBackground,
            opacity: isScheduledToday ? 1 : 0.35,
          }}
        >
          <ThemedText style={{ fontSize: 12, color: textColor }}>
            {habit.periodValue}/{habit.targetValue} {habit.unit}
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPressAction}
          disabled={!isScheduledToday}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: actionBackground,
            opacity: isScheduledToday ? 1 : 0.35,
          }}
        >
          {isDone ? <ThemedText style={{ color: textColor }}>✓</ThemedText> : null}
        </Pressable>
      )}
    </Pressable>
  );
}
