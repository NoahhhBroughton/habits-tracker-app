import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { extractLastEmoji } from '@/lib/emoji';

type Props = {
  visible: boolean;
  initialEmoji: string;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

export function EmojiKeyboardPicker({ visible, initialEmoji, onClose, onSelect }: Props) {
  const theme = useTheme();
  const [emoji, setEmoji] = useState(initialEmoji);

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
          <ThemedText type="default" style={{ marginBottom: Spacing.three }}>
            Pick an emoji
          </ThemedText>

          {/* No placeholder glyph here on purpose — a placeholder emoji is
              indistinguishable from a real selection and reads as "stuck". */}
          <TextInput
            value={emoji}
            onChangeText={(value) => setEmoji(extractLastEmoji(value))}
            autoFocus
            style={{
              width: 96,
              height: 96,
              fontSize: 48,
              textAlign: 'center',
              borderRadius: 16,
              backgroundColor: theme.backgroundElement,
              borderWidth: emoji ? 0 : 2,
              borderColor: theme.textSecondary,
              borderStyle: 'dashed',
            }}
          />

          {emoji ? (
            <Pressable onPress={() => setEmoji('')} style={{ marginTop: Spacing.two }}>
              <ThemedText type="small" themeColor="textSecondary">
                Clear
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three, textAlign: 'center' }}>
              Tap the box, then switch to your emoji keyboard
            </ThemedText>
          )}

          <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four, alignSelf: 'stretch' }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', backgroundColor: theme.backgroundElement }}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onSelect(emoji)}
              disabled={!emoji}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 24,
                alignItems: 'center',
                backgroundColor: theme.text,
                opacity: emoji ? 1 : 0.4,
              }}
            >
              <ThemedText style={{ color: theme.background }}>Use this emoji</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}
