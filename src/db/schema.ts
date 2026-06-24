import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '✅',
      color TEXT NOT NULL DEFAULT '#3c87f7',
      created_at TEXT NOT NULL,
      reminder_hour INTEGER,
      reminder_minute INTEGER,
      notification_id TEXT,
      position INTEGER,
      tracking_type TEXT NOT NULL DEFAULT 'boolean',
      target_value REAL,
      unit TEXT
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 1,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS habit_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      notification_id TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Each ALTER TABLE is wrapped individually because SQLite has no
  // "ADD COLUMN IF NOT EXISTS" — these throw (and are ignored) once the
  // column already exists from a previous run of this migration.
  const columnMigrations = [
    'ALTER TABLE habits ADD COLUMN position INTEGER',
    "ALTER TABLE habits ADD COLUMN tracking_type TEXT NOT NULL DEFAULT 'boolean'",
    'ALTER TABLE habits ADD COLUMN target_value REAL',
    'ALTER TABLE habits ADD COLUMN unit TEXT',
    'ALTER TABLE checkins ADD COLUMN value REAL NOT NULL DEFAULT 1',
  ];
  for (const statement of columnMigrations) {
    try {
      await db.execAsync(statement);
    } catch {
      // column already exists
    }
  }

  await db.runAsync('UPDATE habits SET position = id WHERE position IS NULL');

  // Move any single-reminder habits created before habit_reminders existed
  // into the new table, so multi-reminder habits and old data share one model.
  await db.runAsync(`
    INSERT INTO habit_reminders (habit_id, hour, minute, notification_id)
    SELECT id, reminder_hour, reminder_minute, notification_id FROM habits
    WHERE reminder_hour IS NOT NULL
      AND id NOT IN (SELECT habit_id FROM habit_reminders)
  `);
}
