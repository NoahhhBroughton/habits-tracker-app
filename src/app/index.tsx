import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { HabitRow } from '@/components/habit-row';
import { QuantityEntryModal } from '@/components/quantity-entry-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/useHabitStore';
import type { HabitWithStats } from '@/types/habit';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const { habits, isLoading, refresh, toggleToday, setTodayValue, reorderHabits } = useHabitStore();
  const [quantityHabit, setQuantityHabit] = useState<HabitWithStats | null>(null);

  useEffect(() => {
    refresh(db);
  }, [db, refresh]);

  function handleRowAction(habit: HabitWithStats) {
    if (habit.trackingType === 'quantity') {
      setQuantityHabit(habit);
    } else {
      toggleToday(db, habit.id);
    }
  }

  if (!isLoading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.waveEmoji}>👋</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28, textAlign: 'center' }}>
            Build your first habit
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Add something small you want to do every day — like drinking water or reading for 20
            minutes. Check it off daily and watch your streak grow.
          </ThemedText>
          <Pressable
            onPress={() => router.push('/add-habit')}
            style={[styles.addButton, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText>Add your first habit</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <DraggableFlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        contentContainerStyle={styles.list}
        onDragEnd={({ data }) => reorderHabits(db, data.map((habit) => habit.id))}
        renderItem={({ item, drag, isActive }: RenderItemParams<HabitWithStats>) => (
          <ThemedView style={{ opacity: isActive ? 0.7 : 1 }}>
            <HabitRow
              habit={item}
              onPress={() => router.push(`/habit/${item.id}`)}
              onPressAction={() => handleRowAction(item)}
              onLongPress={drag}
            />
          </ThemedView>
        )}
      />
      <Pressable
        onPress={() => router.push('/settings')}
        style={[styles.settingsFab, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText style={{ fontSize: 22 }}>⚙️</ThemedText>
      </Pressable>
      <Pressable
        onPress={() => router.push('/add-habit')}
        style={[styles.fab, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText style={{ fontSize: 24 }}>+</ThemedText>
      </Pressable>

      {quantityHabit ? (
        <QuantityEntryModal
          visible
          habitName={`${quantityHabit.emoji} ${quantityHabit.name}`}
          unit={quantityHabit.unit ?? ''}
          targetValue={quantityHabit.targetValue ?? 0}
          currentValue={quantityHabit.todayValue}
          onClose={() => setQuantityHabit(null)}
          onSubmit={(value) => {
            setTodayValue(db, quantityHabit.id, value);
            setQuantityHabit(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  waveEmoji: {
    fontSize: 48,
    lineHeight: 60,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: Spacing.two,
  },
  fab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  settingsFab: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
