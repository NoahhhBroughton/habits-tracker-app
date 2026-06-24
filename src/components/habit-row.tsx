import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
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
        backgroundColor: theme.backgroundElement,
        borderRadius: 12,
      }}
    >
      <ThemedText style={{ fontSize: 24 }}>{habit.emoji}</ThemedText>

      <View style={{ flex: 1 }}>
        <ThemedText type="default">{habit.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {habit.streak > 0 ? `🔥 ${habit.streak} day streak` : 'No streak yet'}
        </ThemedText>
      </View>

      {onLongPress ? (
        <ThemedText themeColor="textSecondary" style={{ fontSize: 18, paddingHorizontal: 2 }}>
          ⠿
        </ThemedText>
      ) : null}

      {isQuantity ? (
        <Pressable
          onPress={onPressAction}
          style={{
            minWidth: 56,
            height: 32,
            borderRadius: 16,
            paddingHorizontal: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: habit.doneToday ? habit.color : theme.backgroundSelected,
          }}
        >
          <ThemedText style={{ fontSize: 12, color: habit.doneToday ? '#fff' : theme.text }}>
            {habit.todayValue}/{habit.targetValue} {habit.unit}
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPressAction}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: habit.doneToday ? habit.color : theme.backgroundSelected,
          }}
        >
          {habit.doneToday ? <ThemedText style={{ color: '#fff' }}>✓</ThemedText> : null}
        </Pressable>
      )}
    </Pressable>
  );
}
