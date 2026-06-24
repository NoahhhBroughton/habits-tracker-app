import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/date';

const CELL_GAP = 6;
const MONTHS_BACK = 11;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  completedDates: Set<string>;
  color: string;
  monthsBack?: number;
};

// Standard calendar layout: weekdays as columns (Sun..Sat), weeks as rows.
// Always shows the full month, including days later than today.
function buildMonthRows(monthStart: Date): (Date | null)[][] {
  const totalDaysInMonth = endOfMonth(monthStart).getDate();
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

export function HeatmapGrid({ completedDates, color, monthsBack = MONTHS_BACK }: Props) {
  const theme = useTheme();
  const [showPrevious, setShowPrevious] = useState(false);

  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthKey = toDateKey(currentMonthStart);

  const hasPriorActivity = Array.from(completedDates).some((date) => date < currentMonthKey);

  const previousMonths = Array.from({ length: monthsBack }, (_, index) =>
    addMonths(currentMonthStart, -(index + 1))
  );

  return (
    <View>
      <MonthSection monthStart={currentMonthStart} completedDates={completedDates} color={color} theme={theme} />

      {hasPriorActivity ? (
        <Pressable onPress={() => setShowPrevious((value) => !value)} style={{ marginBottom: 10 }}>
          <ThemedText type="linkPrimary">{showPrevious ? 'Hide previous months' : 'View previous months ›'}</ThemedText>
        </Pressable>
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
