import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

import { ColorWheelPicker } from '@/components/color-wheel-picker';
import { EmojiKeyboardPicker } from '@/components/emoji-keyboard-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatReminderTime } from '@/lib/time';
import type { FrequencyType, TrackingType } from '@/types/habit';

const DEFAULT_EMOJI = '✅';

const EMOJI_ROWS = [
  ['✅', '💧', '📖', '🏃', '🧘', '🥗', '😴'],
  ['✍️', '🏋️', '🚶', '🧹', '💊', '🎯', '🎸'],
];
const EMOJI_PRESETS = EMOJI_ROWS.flat();

const COLOR_ROWS = [
  ['#3c87f7', '#22c55e', '#f97316', '#ec4899', '#a855f7', '#ef4444', '#eab308'],
  ['#14b8a6', '#6366f1', '#84cc16', '#06b6d4', '#f43f5e', '#78716c', '#0ea5e9'],
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export type ReminderTime = { hour: number; minute: number };

export type HabitFormValues = {
  name: string;
  emoji: string;
  color: string;
  trackingType: TrackingType;
  targetValue: number | null;
  unit: string | null;
  frequencyType: FrequencyType;
  frequencyDays: number[] | null;
  reminders: ReminderTime[];
};

type Props = {
  initialValues?: Partial<HabitFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: HabitFormValues) => void;
  footer?: React.ReactNode;
};

function formatTime(time: ReminderTime) {
  return formatReminderTime(time.hour, time.minute);
}

function RainbowSwatch({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ef4444" />
          <Stop offset="0.2" stopColor="#f97316" />
          <Stop offset="0.4" stopColor="#eab308" />
          <Stop offset="0.6" stopColor="#22c55e" />
          <Stop offset="0.8" stopColor="#3c87f7" />
          <Stop offset="1" stopColor="#a855f7" />
        </LinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="url(#rainbow)" />
    </Svg>
  );
}

function CustomTriggerRow({
  label,
  isActive,
  preview,
  onPress,
}: {
  label: string;
  isActive: boolean;
  preview: React.ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.customTriggerRow,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: isActive ? theme.text : 'transparent',
        },
      ]}
    >
      <View style={styles.customTriggerPreview}>{preview}</View>
      <ThemedText style={{ flex: 1 }}>{label}</ThemedText>
      <ThemedText themeColor="textSecondary">{isActive ? 'Change ›' : 'Pick ›'}</ThemedText>
    </Pressable>
  );
}

export function HabitForm({ initialValues, submitLabel, isSubmitting, onSubmit, footer }: Props) {
  const theme = useTheme();

  const [name, setName] = useState(initialValues?.name ?? '');
  const [emoji, setEmoji] = useState(initialValues?.emoji || DEFAULT_EMOJI);
  const [isCustomEmoji, setIsCustomEmoji] = useState(
    () => !EMOJI_PRESETS.includes(initialValues?.emoji || DEFAULT_EMOJI)
  );
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [color, setColor] = useState(initialValues?.color ?? COLOR_ROWS[0][0]);
  const [isCustomColor, setIsCustomColor] = useState(
    () => !COLOR_ROWS.flat().includes(initialValues?.color ?? COLOR_ROWS[0][0])
  );
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const [trackingType, setTrackingType] = useState<TrackingType>(initialValues?.trackingType ?? 'boolean');
  const [targetValueText, setTargetValueText] = useState(
    initialValues?.targetValue != null ? String(initialValues.targetValue) : ''
  );
  const [unit, setUnit] = useState(initialValues?.unit ?? '');

  const [frequencyType, setFrequencyType] = useState<FrequencyType>(initialValues?.frequencyType ?? 'daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>(initialValues?.frequencyDays ?? []);

  const [reminders, setReminders] = useState<ReminderTime[]>(initialValues?.reminders ?? []);
  const [editingReminderIndex, setEditingReminderIndex] = useState<number | null>(null);

  const parsedTarget = parseFloat(targetValueText);
  const isQuantityValid =
    trackingType !== 'quantity' || (Number.isFinite(parsedTarget) && parsedTarget > 0 && unit.trim().length > 0);
  const isFrequencyValid = frequencyType !== 'specific_days' || frequencyDays.length > 0;
  const canSave = name.trim().length > 0 && isQuantityValid && isFrequencyValid && !isSubmitting;

  function toggleFrequencyDay(day: number) {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day].sort()
    );
  }

  function addReminder() {
    setReminders((prev) => [...prev, { hour: 9, minute: 0 }]);
    setEditingReminderIndex(reminders.length);
  }

  function removeReminder(index: number) {
    setReminders((prev) => prev.filter((_, i) => i !== index));
    if (editingReminderIndex === index) setEditingReminderIndex(null);
  }

  function handleReminderTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setEditingReminderIndex(null);
    }
    if (event.type === 'dismissed' || !selectedDate || editingReminderIndex === null) return;
    const updated = { hour: selectedDate.getHours(), minute: selectedDate.getMinutes() };
    setReminders((prev) => prev.map((reminder, i) => (i === editingReminderIndex ? updated : reminder)));
  }

  function handleSubmit() {
    if (!canSave) return;
    onSubmit({
      name: name.trim(),
      emoji,
      color,
      trackingType,
      targetValue: trackingType === 'quantity' ? parsedTarget : null,
      unit: trackingType === 'quantity' ? unit.trim() : null,
      frequencyType,
      frequencyDays: frequencyType === 'specific_days' ? frequencyDays : null,
      reminders,
    });
  }

  const reminderPickerValue = new Date();
  if (editingReminderIndex !== null && reminders[editingReminderIndex]) {
    reminderPickerValue.setHours(reminders[editingReminderIndex].hour, reminders[editingReminderIndex].minute);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Habit name
      </ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
        placeholderTextColor={theme.textSecondary}
        autoFocus={!initialValues}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        How do you want to track this?
      </ThemedText>
      <View style={styles.row}>
        <Pressable
          onPress={() => setTrackingType('boolean')}
          style={[
            styles.trackingTypeOption,
            { backgroundColor: trackingType === 'boolean' ? theme.backgroundSelected : theme.backgroundElement },
          ]}
        >
          <ThemedText>Check off</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setTrackingType('quantity')}
          style={[
            styles.trackingTypeOption,
            { backgroundColor: trackingType === 'quantity' ? theme.backgroundSelected : theme.backgroundElement },
          ]}
        >
          <ThemedText>Track a number</ThemedText>
        </Pressable>
      </View>

      {trackingType === 'quantity' ? (
        <View style={[styles.row, { marginTop: Spacing.two }]}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Daily target
            </ThemedText>
            <TextInput
              value={targetValueText}
              onChangeText={setTargetValueText}
              placeholder="5"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Unit
            </ThemedText>
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder="km, min, pages..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        How often?
      </ThemedText>
      <View style={styles.row}>
        {(
          [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'specific_days', label: 'Specific Days' },
          ] as { value: FrequencyType; label: string }[]
        ).map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFrequencyType(option.value)}
            style={[
              styles.trackingTypeOption,
              { backgroundColor: frequencyType === option.value ? theme.backgroundSelected : theme.backgroundElement },
            ]}
          >
            <ThemedText style={{ fontSize: 13 }}>{option.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {frequencyType === 'specific_days' ? (
        <View style={[styles.row, { marginTop: Spacing.two }]}>
          {WEEKDAY_LABELS.map((label, day) => (
            <Pressable
              key={day}
              onPress={() => toggleFrequencyDay(day)}
              style={[
                styles.weekdayCircle,
                { backgroundColor: frequencyDays.includes(day) ? theme.backgroundSelected : theme.backgroundElement },
              ]}
            >
              <ThemedText style={{ fontSize: 13 }}>{label}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Icon
      </ThemedText>
      {EMOJI_ROWS.map((row, rowIndex) => (
        <ThemedView key={rowIndex} style={styles.row}>
          {row.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setEmoji(option);
                setIsCustomEmoji(false);
              }}
              style={[
                styles.optionCircle,
                {
                  backgroundColor: option === emoji && !isCustomEmoji ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText style={{ fontSize: 20 }}>{option}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      ))}

      <View style={styles.customTriggerSpacing}>
        <CustomTriggerRow
          label="Custom emoji"
          isActive={isCustomEmoji}
          onPress={() => setIsEmojiPickerOpen(true)}
          preview={
            isCustomEmoji ? (
              <ThemedText style={{ fontSize: 22 }}>{emoji}</ThemedText>
            ) : (
              <View style={[styles.dashedPreview, { borderColor: theme.textSecondary }]}>
                <ThemedText themeColor="textSecondary">+</ThemedText>
              </View>
            )
          }
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Color
      </ThemedText>
      {COLOR_ROWS.map((row, rowIndex) => (
        <ThemedView key={rowIndex} style={styles.row}>
          {row.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setColor(option);
                setIsCustomColor(false);
              }}
              style={[
                styles.optionCircle,
                {
                  backgroundColor: option,
                  borderWidth: option === color && !isCustomColor ? 3 : 0,
                  borderColor: theme.text,
                },
              ]}
            />
          ))}
        </ThemedView>
      ))}

      <View style={styles.customTriggerSpacing}>
        <CustomTriggerRow
          label="Custom color"
          isActive={isCustomColor}
          onPress={() => setIsColorPickerOpen(true)}
          preview={
            isCustomColor ? (
              <View style={[styles.colorPreviewCircle, { backgroundColor: color }]} />
            ) : (
              <RainbowSwatch size={28} />
            )
          }
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Reminders
      </ThemedText>
      {reminders.map((reminder, index) => (
        <View key={index} style={[styles.reminderRow, { backgroundColor: theme.backgroundElement }]}>
          <Pressable onPress={() => setEditingReminderIndex(index)} style={{ flex: 1 }}>
            <ThemedText type="linkPrimary">{formatTime(reminder)}</ThemedText>
          </Pressable>
          <Pressable onPress={() => removeReminder(index)}>
            <ThemedText themeColor="textSecondary">✕</ThemedText>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={addReminder} style={styles.addReminderButton}>
        <ThemedText type="linkPrimary">+ Add reminder</ThemedText>
      </Pressable>
      {reminders.length > 1 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          You'll get a notification at each time, every day.
        </ThemedText>
      ) : null}

      {editingReminderIndex !== null ? (
        <ThemedView style={styles.timePickerWrap}>
          <DateTimePicker mode="time" value={reminderPickerValue} onChange={handleReminderTimeChange} />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setEditingReminderIndex(null)} style={styles.doneButton}>
              <ThemedText type="linkPrimary">Done</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSave}
        style={[styles.saveButton, { backgroundColor: theme.text, opacity: canSave ? 1 : 0.4 }]}
      >
        <ThemedText style={{ color: theme.background }}>{submitLabel}</ThemedText>
      </Pressable>

      {footer}

      <EmojiKeyboardPicker
        visible={isEmojiPickerOpen}
        initialEmoji={isCustomEmoji ? emoji : ''}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={(value) => {
          setEmoji(value);
          setIsCustomEmoji(true);
          setIsEmojiPickerOpen(false);
        }}
      />

      <ColorWheelPicker
        visible={isColorPickerOpen}
        initialColor={color}
        onClose={() => setIsColorPickerOpen(false)}
        onSelect={(hex) => {
          setColor(hex);
          setIsCustomColor(true);
          setIsColorPickerOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  input: {
    marginTop: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  sectionLabel: {
    marginTop: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  trackingTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTriggerSpacing: {
    marginTop: Spacing.three,
  },
  customTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    borderWidth: 2,
  },
  customTriggerPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreviewCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  addReminderButton: {
    marginTop: Spacing.two,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timePickerWrap: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  doneButton: {
    paddingVertical: Spacing.two,
  },
  saveButton: {
    marginTop: Spacing.five,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
});
