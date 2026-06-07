import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDays: number[]; // JS getDay() values: 0=Sun, 1=Mon, ..., 6=Sat
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthCalendar({ selectedDate, onSelectDate, availableDays }: Props) {
  const today = startOfDay(new Date());

  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Leading empty cells to align Monday as first column
  const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun
  const leadingEmpty = firstDayJS === 0 ? 6 : firstDayJS - 1;

  // Build weeks as 2D array
  const flatCells: (number | null)[] = [
    ...Array(leadingEmpty).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (flatCells.length % 7 !== 0) flatCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < flatCells.length; i += 7) {
    weeks.push(flatCells.slice(i, i + 7));
  }

  const isThisMonthOrEarlier =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month <= today.getMonth());

  function isDayAvailable(day: number): boolean {
    const d = startOfDay(new Date(year, month, day));
    if (d < today) return false;
    return availableDays.includes(d.getDay());
  }

  function isDaySelected(day: number): boolean {
    if (!selectedDate) return false;
    return isSameDay(new Date(year, month, day), selectedDate);
  }

  function isDayToday(day: number): boolean {
    return isSameDay(new Date(year, month, day), today);
  }

  function goToPrevMonth() {
    setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const CIRCLE = 36;

  return (
    <View>
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Pressable
          onPress={goToPrevMonth}
          hitSlop={12}
          disabled={isThisMonthOrEarlier}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isThisMonthOrEarlier ? "#d1d5db" : "#6b7280"}
          />
        </Pressable>

        <Text className="text-foreground font-semibold" style={{ fontSize: 16 }}>
          {MONTH_NAMES[month]} {year}
        </Text>

        <Pressable onPress={goToNextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color="#6b7280" />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-1">
        {DAY_HEADERS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
            <Text
              className="text-muted font-semibold"
              style={{ fontSize: 12 }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar rows */}
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, ci) => {
            if (day === null) {
              return <View key={`e-${ci}`} style={{ flex: 1 }} />;
            }

            const available = isDayAvailable(day);
            const selected = isDaySelected(day);
            const isToday = isDayToday(day);

            return (
              <Pressable
                key={day}
                onPress={() => available && onSelectDate(new Date(year, month, day))}
                style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}
              >
                <View
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    borderRadius: CIRCLE / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? "#1e3a8a" : "transparent",
                    borderWidth: isToday && !selected ? 1.5 : 0,
                    borderColor: "#1e3a8a",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: selected ? "700" : "400",
                      color: selected
                        ? "#ffffff"
                        : available
                        ? "#111827"
                        : "#d1d5db",
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
