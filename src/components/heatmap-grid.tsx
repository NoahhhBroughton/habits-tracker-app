import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/date';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const MONTHS_BACK = 5;

type Props = {
  checkins: Set<string>;
  color: string;
  monthsBack?: number;
};

function buildMonthColumns(monthStart: Date, today: Date): (Date | null)[][] {
  const lastDay = endOfMonth(monthStart);
  const totalDaysInMonth = lastDay.getDate();
  const leadingBlanks = monthStart.getDay(); // days before the 1st to pad to Sunday

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    cells.push(date > today ? null : date);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const columns: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }
  return columns;
}

function MonthSection({ monthStart, today, checkins, color, theme }: {
  monthStart: Date;
  today: Date;
  checkins: Set<string>;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const columns = buildMonthColumns(monthStart, today);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.backgroundElement,
        borderRadius: 10,
        padding: 8,
        marginRight: 10,
      }}
    >
      <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 6 }}>
        {format(monthStart, 'MMM yyyy')}
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: CELL_GAP }}>
        {columns.map((column, columnIndex) => (
          <View key={columnIndex} style={{ gap: CELL_GAP }}>
            {column.map((date, dayIndex) => {
              const key = date ? toDateKey(date) : `empty-${columnIndex}-${dayIndex}`;
              const isChecked = date ? checkins.has(key) : false;
              return (
                <View
                  key={key}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 3,
                    backgroundColor: date ? (isChecked ? color : theme.backgroundElement) : 'transparent',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

export function HeatmapGrid({ checkins, color, monthsBack = MONTHS_BACK }: Props) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const today = new Date();
  const currentMonthStart = startOfMonth(today);

  const months = Array.from({ length: monthsBack + 1 }, (_, index) =>
    addMonths(currentMonthStart, -(monthsBack - index))
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
    >
      <View style={{ flexDirection: 'row' }}>
        {months.map((monthStart) => (
          <MonthSection
            key={monthStart.toISOString()}
            monthStart={monthStart}
            today={today}
            checkins={checkins}
            color={color}
            theme={theme}
          />
        ))}
      </View>
    </ScrollView>
  );
}
