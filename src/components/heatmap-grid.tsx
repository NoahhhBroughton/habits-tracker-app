import { format, startOfMonth } from 'date-fns';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { parseDateKey, toDateKey } from '@/lib/date';

const CELL_GAP = 6;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  completedDates: Set<string>;
  color: string;
};

// Standard calendar layout: weekdays as columns (Sun..Sat), weeks as rows.
// Always shows the full month, including days later than today.
function buildMonthRows(monthStart: Date): (Date | null)[][] {
  const totalDaysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const leadingBlanks = monthStart.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= totalDaysInMonth; day++) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function MonthSection({
  monthStart,
  completedDates,
  color,
  theme,
}: {
  monthStart: Date;
  completedDates: Set<string>;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const rows = buildMonthRows(monthStart);

  return (
    <View style={{ marginBottom: 14 }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 6 }}>
        {format(monthStart, 'MMMM yyyy')}
      </ThemedText>

      <View style={{ flexDirection: 'row', gap: CELL_GAP, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>{label}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap: CELL_GAP, marginBottom: CELL_GAP }}>
          {row.map((date, dayIndex) => {
            const key = date ? toDateKey(date) : `empty-${rowIndex}-${dayIndex}`;
            const isCompleted = date ? completedDates.has(key) : false;
            return (
              <View
                key={key}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 6,
                  backgroundColor: date ? (isCompleted ? color : theme.backgroundElement) : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {date ? (
                  <Text style={{ fontSize: 11, color: isCompleted ? '#ffffff' : theme.textSecondary }}>
                    {date.getDate()}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function HeatmapGrid({ completedDates, color }: Props) {
  const theme = useTheme();
  const [showPrevious, setShowPrevious] = useState(false);

  const currentMonthStart = startOfMonth(new Date());
  const currentMonthKey = toDateKey(currentMonthStart);

  // Only offer months that actually have tracked completions — no point
  // showing empty grids for months before the habit existed.
  const trackedPreviousMonthKeys = new Set<string>();
  for (const date of completedDates) {
    if (date < currentMonthKey) trackedPreviousMonthKeys.add(date.slice(0, 7));
  }
  const previousMonths = Array.from(trackedPreviousMonthKeys)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => parseDateKey(`${key}-01`));

  return (
    <View>
      <MonthSection monthStart={currentMonthStart} completedDates={completedDates} color={color} theme={theme} />

      {previousMonths.length > 0 ? (
        <ActionButton
          label={showPrevious ? 'Hide previous months' : 'View previous months'}
          onPress={() => setShowPrevious((value) => !value)}
          style={{ alignSelf: 'flex-start', marginBottom: 10 }}
        />
      ) : null}

      {showPrevious
        ? previousMonths.map((monthStart) => (
            <MonthSection
              key={monthStart.toISOString()}
              monthStart={monthStart}
              completedDates={completedDates}
              color={color}
              theme={theme}
            />
          ))
        : null}
    </View>
  );
}
