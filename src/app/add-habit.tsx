import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

import { ColorWheelPicker } from '@/components/color-wheel-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabitStore } from '@/store/useHabitStore';

const EMOJI_OPTIONS = [
  '✅', '💧', '📖', '🏃', '🧘', '🥗', '😴', '✍️',
  '🏋️', '🚶', '🧹', '💊', '🎯', '🎸', '🧠', '🚭',
  '🌱', '🦷', '💰', '☀️',
];

const COLOR_OPTIONS = [
  '#3c87f7', '#22c55e', '#f97316', '#ec4899',
  '#a855f7', '#ef4444', '#eab308', '#14b8a6',
  '#6366f1', '#84cc16',
];

function RainbowSwatch({ selected }: { selected: boolean }) {
  return (
    <Svg width={44} height={44}>
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
      <Circle
        cx={22}
        cy={22}
        r={selected ? 19 : 21}
        fill="url(#rainbow)"
        stroke={selected ? '#000' : 'transparent'}
        strokeWidth={3}
      />
    </Svg>
  );
}

export default function AddHabitScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const addHabit = useHabitStore((state) => state.addHabit);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    await addHabit(db, { name: name.trim(), emoji, color });
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Habit name
      </ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Icon
      </ThemedText>
      <ThemedView style={styles.row}>
        {EMOJI_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setEmoji(option)}
            style={[
              styles.optionCircle,
              { backgroundColor: option === emoji ? theme.backgroundSelected : theme.backgroundElement },
            ]}
          >
            <ThemedText style={{ fontSize: 20 }}>{option}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Or type any emoji
      </ThemedText>
      <TextInput
        value={emoji}
        onChangeText={(value) => setEmoji(value || EMOJI_OPTIONS[0])}
        placeholder="Tap and switch to your emoji keyboard"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, fontSize: 20 }]}
      />

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        Color
      </ThemedText>
      <ThemedView style={styles.row}>
        {COLOR_OPTIONS.map((option) => (
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
        <Pressable onPress={() => setIsPickerOpen(true)} style={styles.optionCircle}>
          <RainbowSwatch selected={isCustomColor} />
        </Pressable>
      </ThemedView>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, { backgroundColor: theme.text, opacity: canSave ? 1 : 0.4 }]}
      >
        <ThemedText style={{ color: theme.background }}>Save habit</ThemedText>
      </Pressable>

      <ColorWheelPicker
        visible={isPickerOpen}
        initialColor={color}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(hex) => {
          setColor(hex);
          setIsCustomColor(true);
          setIsPickerOpen(false);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
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
    gap: Spacing.two,
    marginTop: Spacing.two,
    flexWrap: 'wrap',
  },
  optionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: Spacing.five,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
});
