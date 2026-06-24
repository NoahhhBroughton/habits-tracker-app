# Habits Tracker App

React Native + Expo habit tracker. Local-only data via SQLite, state via Zustand, a
hand-rolled GitHub-style heatmap (Victory Native doesn't do calendar grids), and optional
daily local reminders via expo-notifications.

## Stack

- Expo SDK 56 + Expo Router (file-based routes under `src/app`)
- expo-sqlite for local storage (`src/db/schema.ts`)
- Zustand for app state (`src/store/useHabitStore.ts`)
- Custom heatmap grid component (`src/components/heatmap-grid.tsx`)
- expo-notifications for daily reminders (nice-to-have)

## Requirements

Expo SDK 56 requires **Node 22.13+**. This repo uses `nvm`:

```bash
nvm use 22   # or just open a new terminal — `nvm use default` runs automatically
```

## Running it

```bash
npm install
npm start
```

This prints a QR code in the terminal. Scan it with the **Expo Go** app (free, App
Store / Play Store) on your phone — make sure your phone and computer are on the same
Wi-Fi network. The app reloads automatically as you edit files.

If your phone can't reach the dev server over LAN (corporate/guest Wi-Fi, VPN, etc.),
run `npx expo start --tunnel` instead (slower, but works across networks; first run
will ask to install `@expo/ngrok`).

## Project structure

```
src/
  app/                  Expo Router screens (file-based routing)
    index.tsx           Home: habit list + check-off + empty-state onboarding
    add-habit.tsx        Modal: create a habit (name, emoji, color)
    habit/[id].tsx        Detail: streak, heatmap, reminder toggle, delete
  components/           Reusable UI (HabitRow, HeatmapGrid, ThemedText/View)
  db/schema.ts          SQLite migration (habits, checkins tables)
  store/useHabitStore.ts Zustand store — all CRUD + streak calculation
  lib/                  date/streak helpers, notifications helper
```

## Notes

- Data is 100% local (SQLite on-device). Nothing leaves the phone.
- Local notifications work fine in Expo Go. Push (remote) notifications don't — not
  used here, since reminders are scheduled locally.
