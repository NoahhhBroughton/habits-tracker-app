import { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { format } from 'date-fns';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ActionButton } from '@/components/action-button';
import { HeatmapGrid } from '@/components/heatmap-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseDateKey, todayKey } from '@/lib/date';
import { countTotalCompletions, expandCompletedDatesForDisplay, formatFrequencyDays, totalCompletionsUnit } from '@/lib/frequency';
import { formatReminderTime } from '@/lib/time';
import { useHabitStore } from '@/store/useHabitStore';

function formatNoteDate(date: string) {
  return date === todayKey() ? 'Today' : format(parseDateKey(date), 'MMM d, yyyy');
}

function formatReminderSummary(reminder: { hour: number; minute: number; days: number[] | null }) {
  const days = reminder.days ? formatFrequencyDays(reminder.days) : 'Every day';
  return `${formatReminderTime(reminder.hour, reminder.minute)} · ${days}`;
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
        headerRight: () => <ActionButton label="Edit" onPress={() => router.push(`/habit/${habit.id}/edit`)} />,
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
  const lifetimeQuantity =
    habit.trackingType === 'quantity'
      ? Array.from(habit.valueByDate.values()).reduce((sum, value) => sum + value, 0)
      : 0;
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
          {habit.frequencyType === 'weekly' ? 'This week' : 'Today'}: {habit.periodValue} / {habit.targetValue}{' '}
          {habit.unit}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
        Total: {totalCount} {totalUnit}
        {totalCount === 1 ? '' : 's'}
      </ThemedText>

      {habit.trackingType === 'quantity' ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          All-Time Total: {lifetimeQuantity} {habit.unit}
        </ThemedText>
      ) : null}

      {habit.reminders.map((reminder) => (
        <ThemedText key={reminder.id} type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          Reminder: {formatReminderSummary(reminder)}
        </ThemedText>
      ))}

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
            <ActionButton label="Cancel" onPress={closeNoteEditor} style={{ flex: 1 }} />
            <ActionButton label="Save" emphasis onPress={handleSubmitNote} style={{ flex: 1 }} />
          </View>
        </View>
      ) : !hasNoteToday ? (
        <ActionButton label="+ Add a note for today" onPress={() => openNoteEditor(todayKey(), '')} style={{ alignSelf: 'flex-start' }} />
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
            <View style={styles.noteActions}>
              <ActionButton label="Edit" onPress={() => openNoteEditor(date, note)} style={styles.noteActionButton} />
              <ActionButton label="Delete" onPress={() => handleDeleteNote(date)} style={styles.noteActionButton} />
            </View>
          </View>
        )
      )}

      <ThemedView style={{ marginTop: Spacing.four }}>
        <HeatmapGrid
          completedDates={expandCompletedDatesForDisplay(habit.completedDates, habit.frequencyType)}
          color={habit.color}
        />
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
  noteActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginLeft: Spacing.two,
  },
  noteActionButton: {
    paddingHorizontal: Spacing.two,
    minWidth: 56,
  },
});
