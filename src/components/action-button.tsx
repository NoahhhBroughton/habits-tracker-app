import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  emphasis?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A small themed action button, used in place of bare blue/red link-style
// text so calls to action (Edit, Delete, Save, etc.) match the app's
// neutral background-element styling instead of standing out as raw links.
export function ActionButton({ label, emphasis, style, ...rest }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      {...rest}
      style={[styles.button, { backgroundColor: emphasis ? theme.backgroundSelected : theme.backgroundElement }, style]}
    >
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});
