/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useActiveColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((state) => state.themePreference);

  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }
  return systemScheme ?? 'light';
}

export function useTheme() {
  return Colors[useActiveColorScheme()];
}
