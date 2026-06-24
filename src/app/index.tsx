import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { HabitRow } from '@/components/habit-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/useHabitStore';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const { habits, isLoading, refresh, toggleToday } = useHabitStore();

  useEffect(() => {
    refresh(db);
  }, [db, refresh]);

  if (!isLoading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={{ fontSize: 48 }}>👋</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28, textAlign: 'center' }}>
            Build your first habit
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Add something small you want to do every day — like drinking water or reading for 20
            minutes. Check it off daily and watch your streak grow.
          </ThemedText>
          <Pressable
            onPress={() => router.push('/add-habit')}
            style={[styles.addButton, { backgroundColor: theme.text }]}
          >
            <ThemedText style={{ color: theme.background }}>Add your first habit</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            onPress={() => router.push(`/habit/${item.id}`)}
            onToggleToday={() => toggleToday(db, item.id)}
          />
        )}
      />
      <Pressable
        onPress={() => router.push('/add-habit')}
        style={[styles.fab, { backgroundColor: theme.text }]}
      >
        <ThemedText style={{ color: theme.background, fontSize: 24 }}>+</ThemedText>
      </Pressable>
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
});
