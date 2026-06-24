import { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { format } from 'date-fns';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { HeatmapGrid } from '@/components/heatmap-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseDateKey, todayKey } from '@/lib/date';
import { countTotalCompletions, formatFrequencyDays, totalCompletionsUnit } from '@/lib/frequency';
import { formatReminderTime } from '@/lib/time';
import { useHabitStore } from '@/store/useHabitStore';

function formatNoteDate(date: string) {
  return date === todayKey() ? 'Today' : format(parseDateKey(date), 'MMM d, yyyy');
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const { habits, setNoteForDate } = useHabitStore();

  const habit = habits.find((item) => item.id === Number(id));

  const [activeNoteDate, setActiveNoteDate] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useLayoutEffect(() => {
    if (habit) {
      navigation.setOptions({
        title: `${habit.emoji} ${habit.name}`,
        headerRight: () => (
          <Pressable onPress={() => router.push(`/habit/${habit.id}/edit`)}>
            <ThemedText type="linkPrimary">Edit</ThemedText>
          </Pressable>
        ),
      });
    }
  }, [habit, navigation, router]);

  if (!habit) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Habit not found.</ThemedText>
      </ThemedView>
    );
  }

  const streakUnit = habit.frequencyType === 'weekly' ? 'week' : 'day';
  const totalCount = countTotalCompletions(habit.completedDates, habit.frequencyType);
  const totalUnit = totalCompletionsUnit(habit.frequencyType);
  const lifetimeQuantity = habit.trackingType === 'quantity' ? Array.from(habit.valueByDate.values()).reduce((sum, value) => sum + value, 0) : 0;
  const hasNoteToday = habit.notesByDate.has(todayKey());
  const noteEntries = Array.from(habit.notesByDate.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  function openNoteEditor(date: string, currentNote: string) {
    setActiveNoteDate(date);
    setNoteDraft(currentNote);
  }

  function closeNoteEditor() {
    setActiveNoteDate(null);
    setNoteDraft('');
  }

  function handleSubmitNote() {
    if (!activeNoteDate || !habit) return;
    setNoteForDate(db, habit.id, activeNoteDate, noteDraft);
    closeNoteEditor();
  }

  function handleDeleteNote(date: string) {
    if (!habit) return;
    const target = habit;
    Alert.alert('Delete note', 'Remove this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setNoteForDate(db, target.id, date, '');
          if (activeNoteDate === date) closeNoteEditor();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="default" themeColor="textSecondary">
        {habit.streak > 0
          ? `🔥 ${habit.streak} ${streakUnit}${habit.streak === 1 ? '' : 's'} streak`
          : 'No streak yet — check in today to start one'}
      </ThemedText>

      {habit.frequencyType === 'specific_days' && habit.frequencyDays ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          Scheduled: {formatFrequencyDays(habit.frequencyDays)}
        </ThemedText>
      ) : null}

      {habit.trackingType === 'quantity' ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          Today: {habit.todayValue} / {habit.targetValue} {habit.unit}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
        Total: {totalCount} {totalUnit}{totalCount === 1 ? '' : 's'}
      </ThemedText>

      {habit.trackingType === 'quantity' ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          Lifetime total: {lifetimeQuantity} {habit.unit}
        </ThemedText>
      ) : null}

      {habit.reminders.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          {habit.reminders.length === 1
            ? `Reminder at ${formatReminderTime(habit.reminders[0].hour, habit.reminders[0].minute)}`
            : `${habit.reminders.length} reminders a day`}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Notes
      </ThemedText>

      {activeNoteDate ? (
        <View>
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="Why was this missed? Any highlights?"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmitNote}
            style={[styles.noteInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <View style={styles.noteEditorActions}>
            <Pressable onPress={closeNoteEditor}>
              <ThemedText themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={handleSubmitNote}>
              <ThemedText type="linkPrimary">Save</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : !hasNoteToday ? (
        <Pressable onPress={() => openNoteEditor(todayKey(), '')}>
          <ThemedText type="linkPrimary">+ Add a note for today</ThemedText>
        </Pressable>
      ) : null}

      {noteEntries.map(([date, note]) =>
        date === activeNoteDate ? null : (
          <View key={date} style={[styles.noteRow, { backgroundColor: theme.backgroundElement }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="small" themeColor="textSecondary">
                {formatNoteDate(date)}
              </ThemedText>
              <ThemedText style={{ marginTop: 2 }}>{note}</ThemedText>
            </View>
            <Pressable onPress={() => openNoteEditor(date, note)} style={{ marginLeft: Spacing.two }}>
              <ThemedText type="linkPrimary">Edit</ThemedText>
            </Pressable>
            <Pressable onPress={() => handleDeleteNote(date)} style={{ marginLeft: Spacing.three }}>
              <ThemedText style={{ color: '#ef4444' }}>Delete</ThemedText>
            </Pressable>
          </View>
        )
      )}

      <ThemedView style={{ marginTop: Spacing.four }}>
        <HeatmapGrid completedDates={habit.completedDates} color={habit.color} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  noteInput: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 14,
  },
  noteEditorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
});
