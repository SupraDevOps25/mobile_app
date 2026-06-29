import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCaregiverProfile,
  useSetSchedule,
} from "@/hooks/useCaregiverProfile";

const GREEN = "#16a34a";
const GREEN_LIGHT = "#f0fdf4";
const GREEN_TEXT = "#15803d";
const SCREEN_BG = "#f3f4f6";
const CARD_BORDER = "#eef2f6";
const LABEL = "#9ca3af";

// Pills shown Monday-first; value is the JS getDay() code (0=Sun … 6=Sat).
const WEEKDAYS: { code: number; short: string }[] = [
  { code: 1, short: "Mo" },
  { code: 2, short: "Tu" },
  { code: 3, short: "We" },
  { code: 4, short: "Th" },
  { code: 5, short: "Fr" },
  { code: 6, short: "Sa" },
  { code: 0, short: "Su" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function minToLabel(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}
function labelToMin(label: string) {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={{ color: LABEL, fontSize: 11, letterSpacing: 1, fontWeight: "600", marginBottom: 10 }}>
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: 16,
        marginBottom: 14,
      }}
    >
      {children}
    </View>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
  disabledDec,
  disabledInc,
}: {
  value: string;
  onDec: () => void;
  onInc: () => void;
  disabledDec?: boolean;
  disabledInc?: boolean;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 14 }}>
      <Pressable
        onPress={onDec}
        disabled={disabledDec}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: disabledDec ? "#f3f4f6" : "#ecfdf5" }}
      >
        <Ionicons name="remove" size={18} color={disabledDec ? "#d1d5db" : GREEN} />
      </Pressable>
      <Text className="text-foreground font-bold" style={{ fontSize: 16, minWidth: 56, textAlign: "center" }}>
        {value}
      </Text>
      <Pressable
        onPress={onInc}
        disabled={disabledInc}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: disabledInc ? "#f3f4f6" : "#ecfdf5" }}
      >
        <Ionicons name="add" size={18} color={disabledInc ? "#d1d5db" : GREEN} />
      </Pressable>
    </View>
  );
}

// Read-only month grid that highlights which upcoming dates fall on the
// selected working days — gives the schedule a calendar at a glance.
function MonthPreview({ workingDays }: { workingDays: number[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7; // Monday-first offset

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View>
      <View className="flex-row" style={{ marginBottom: 6 }}>
        {WEEKDAYS.map((d) => (
          <Text
            key={d.code}
            style={{ flex: 1, textAlign: "center", color: LABEL, fontSize: 11, fontWeight: "600" }}
          >
            {d.short}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`b${idx}`} style={{ width: `${100 / 7}%`, height: 38 }} />;
          }
          const date = new Date(year, month, day);
          const isWorking = workingDays.includes(date.getDay());
          const isPast = day < todayDate;
          const isToday = day === todayDate;
          return (
            <View key={day} style={{ width: `${100 / 7}%`, height: 38, alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isWorking && !isPast ? GREEN_LIGHT : "transparent",
                  borderWidth: isToday ? 1.5 : 0,
                  borderColor: GREEN,
                  opacity: isPast ? 0.35 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isWorking ? "700" : "400",
                    color: isWorking && !isPast ? GREEN_TEXT : "#374151",
                  }}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { data: profile, isLoading } = useCaregiverProfile();
  const setSchedule = useSetSchedule();

  const [days, setDays] = useState<number[]>([]);
  const [startMin, setStartMin] = useState(480); // 08:00
  const [endMin, setEndMin] = useState(1020); // 17:00
  const [maxVisits, setMaxVisits] = useState(3);

  useEffect(() => {
    if (!profile) return;
    setDays(profile.workingDays);
    setStartMin(labelToMin(profile.workStart));
    setEndMin(labelToMin(profile.workEnd));
    setMaxVisits(profile.maxVisitsPerDay);
  }, [profile]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    const sameDays =
      profile.workingDays.length === days.length &&
      [...profile.workingDays].sort().join() === [...days].sort().join();
    return (
      !sameDays ||
      labelToMin(profile.workStart) !== startMin ||
      labelToMin(profile.workEnd) !== endMin ||
      profile.maxVisitsPerDay !== maxVisits
    );
  }, [profile, days, startMin, endMin, maxVisits]);

  function toggleDay(code: number) {
    setDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code],
    );
  }

  function handleSave() {
    if (days.length === 0) {
      Alert.alert("Pick at least one day", "Select the weekdays you usually work.");
      return;
    }
    setSchedule.mutate(
      {
        workingDays: days,
        workStart: minToLabel(startMin),
        workEnd: minToLabel(endMin),
        maxVisitsPerDay: maxVisits,
      },
      {
        onSuccess: () => Alert.alert("Schedule saved", "Your working schedule is updated."),
        onError: (err: Error) => Alert.alert("Couldn't save", err.message),
      },
    );
  }

  const today = new Date();

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      {/* Header */}
      <View className="px-5 pb-3" style={{ paddingTop: top + 10 }}>
        <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
          My schedule
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
          Set the days and hours you&apos;re available to work.
        </Text>
      </View>

      {isLoading || !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GREEN} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 6 }}
          >
            {/* Available days */}
            <SectionLabel title="Available days" />
            <Card>
              <View className="flex-row" style={{ gap: 6 }}>
                {WEEKDAYS.map((d) => {
                  const active = days.includes(d.code);
                  return (
                    <Pressable
                      key={d.code}
                      onPress={() => toggleDay(d.code)}
                      className="flex-1 items-center rounded-xl"
                      style={{
                        paddingVertical: 12,
                        backgroundColor: active ? GREEN : "#f3f4f6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: active ? "#ffffff" : "#6b7280",
                        }}
                      >
                        {d.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Working hours */}
            <SectionLabel title="Working hours" />
            <Card>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
                <Text className="text-foreground" style={{ fontSize: 14, fontWeight: "500" }}>
                  Start time
                </Text>
                <Stepper
                  value={minToLabel(startMin)}
                  onDec={() => setStartMin((m) => Math.max(0, m - 30))}
                  onInc={() => setStartMin((m) => Math.min(endMin - 30, m + 30))}
                  disabledDec={startMin <= 0}
                  disabledInc={startMin >= endMin - 30}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground" style={{ fontSize: 14, fontWeight: "500" }}>
                  End time
                </Text>
                <Stepper
                  value={minToLabel(endMin)}
                  onDec={() => setEndMin((m) => Math.max(startMin + 30, m - 30))}
                  onInc={() => setEndMin((m) => Math.min(1410, m + 30))}
                  disabledDec={endMin <= startMin + 30}
                  disabledInc={endMin >= 1410}
                />
              </View>
            </Card>

            {/* Max visits per day */}
            <SectionLabel title="Max visits per day" />
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-foreground" style={{ fontSize: 14, fontWeight: "500" }}>
                    Limit daily bookings
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                    Avoid overbooking on busy days.
                  </Text>
                </View>
                <Stepper
                  value={String(maxVisits)}
                  onDec={() => setMaxVisits((v) => Math.max(1, v - 1))}
                  onInc={() => setMaxVisits((v) => Math.min(20, v + 1))}
                  disabledDec={maxVisits <= 1}
                  disabledInc={maxVisits >= 20}
                />
              </View>
            </Card>

            {/* Month preview */}
            <SectionLabel title={`${MONTHS[today.getMonth()]} ${today.getFullYear()}`} />
            <Card>
              <MonthPreview workingDays={days} />
              <View className="flex-row items-center" style={{ marginTop: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN_LIGHT }} />
                <Text style={{ color: "#6b7280", fontSize: 12, marginLeft: 6 }}>
                  Upcoming working days
                </Text>
              </View>
            </Card>
          </ScrollView>

          {/* Sticky footer */}
          <View className="px-4 pt-3" style={{ paddingBottom: bottom + 12, backgroundColor: SCREEN_BG }}>
            <Pressable
              onPress={handleSave}
              disabled={!dirty || setSchedule.isPending}
              className="rounded-2xl items-center justify-center flex-row"
              style={{ backgroundColor: !dirty ? "#9ca3af" : GREEN, paddingVertical: 16, gap: 8 }}
            >
              {setSchedule.isPending && <ActivityIndicator color="#ffffff" size="small" />}
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                Save schedule
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
