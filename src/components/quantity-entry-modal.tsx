import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  habitName: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  onClose: () => void;
  onSubmit: (value: number) => void;
};

export function QuantityEntryModal({
  visible,
  habitName,
  unit,
  targetValue,
  currentValue,
  onClose,
  onSubmit,
}: Props) {
  const theme = useTheme();
  const [text, setText] = useState(currentValue > 0 ? String(currentValue) : '');

  const parsed = parseFloat(text);
  const isValid = text.trim().length === 0 || (Number.isFinite(parsed) && parsed >= 0);

  function handleSave() {
    const value = text.trim().length === 0 ? 0 : parsed;
    if (!Number.isFinite(value) || value < 0) return;
    onSubmit(value);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <ThemedView
          style={{
            padding: Spacing.four,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            alignItems: 'center',
          }}
        >
          <ThemedText type="default" style={{ marginBottom: Spacing.one, textAlign: 'center' }}>
            {habitName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
            Target: {targetValue} {unit} a day
          </ThemedText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={{
                width: 100,
                height: 64,
                fontSize: 28,
                textAlign: 'center',
                borderRadius: 16,
                backgroundColor: theme.backgroundElement,
                color: theme.text,
              }}
            />
            <ThemedText type="default" themeColor="textSecondary">
              {unit}
            </ThemedText>
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four, alignSelf: 'stretch' }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', backgroundColor: theme.backgroundElement }}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 24,
                alignItems: 'center',
                backgroundColor: theme.text,
                opacity: isValid ? 1 : 0.4,
              }}
            >
              <ThemedText style={{ color: theme.background }}>Save</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}
