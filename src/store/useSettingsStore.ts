import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

type SettingsStore = {
  themePreference: ThemePreference;
  loadSettings: (db: SQLiteDatabase) => Promise<void>;
  setThemePreference: (db: SQLiteDatabase, preference: ThemePreference) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  themePreference: 'system',

  loadSettings: async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'themePreference'"
    );
    if (row?.value === 'light' || row?.value === 'dark' || row?.value === 'system') {
      set({ themePreference: row.value });
    }
  },

  setThemePreference: async (db, preference) => {
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES ('themePreference', $value)
       ON CONFLICT(key) DO UPDATE SET value = $value`,
      { $value: preference }
    );
    set({ themePreference: preference });
  },
}));
