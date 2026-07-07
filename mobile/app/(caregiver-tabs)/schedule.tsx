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
import { useCaregiverAssignments } from "@/hooks/useVisits";

const GREEN = "#16a34a";
const GREEN_LIGHT = "#dcfce7";
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

// Company policy: care visits run every day from a fixed morning start, and the
// per-visit length is set by each care package. So a nurse's week is always
// open and their hours are fixed — the only thing they control is how many
// short visits they'll take in a day.
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];
const POLICY_START_LABEL = "8:00 AM";

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

// Month grid (Monday-first) that marks the days carrying a booked care visit.
// Laid out as fixed rows of 7 flex cells so every column — including Sunday —
// stays aligned with the header.
function MonthPreview({ bookedDays }: { bookedDays: Set<number> }) {
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
  // Pad the tail so the final week is a full row of 7.
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

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
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={{ flex: 1, height: 44 }} />;
            }
            const isBooked = bookedDays.has(day);
            const isPast = day < todayDate;
            const isToday = day === todayDate;
            return (
              <View
                key={di}
                style={{ flex: 1, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    // Booked days read as a soft green fill — no dot.
                    backgroundColor: isBooked ? GREEN_LIGHT : "transparent",
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: GREEN,
                    opacity: isPast && !isBooked ? 0.4 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isBooked ? "700" : "400",
                      color: isBooked ? GREEN_TEXT : "#374151",
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function ScheduleScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { data: profile, isLoading } = useCaregiverProfile();
  const { data: assignments } = useCaregiverAssignments();
  const setSchedule = useSetSchedule();

  // Days and hours are fixed by policy — Max visits/day is the only setting.
  const [maxVisits, setMaxVisits] = useState(3);

  useEffect(() => {
    if (!profile) return;
    setMaxVisits(profile.maxVisitsPerDay);
  }, [profile]);

  const dirty = profile ? profile.maxVisitsPerDay !== maxVisits : false;

  function handleSave() {
    if (!profile) return;
    setSchedule.mutate(
      {
        // Days & hours follow company policy; we send the policy defaults so the
        // stored record stays consistent, and persist the nurse's daily limit.
        workingDays: ALL_DAYS,
        workStart: "08:00",
        workEnd: profile.workEnd,
        maxVisitsPerDay: maxVisits,
      },
      {
        onSuccess: () => Alert.alert("Saved", "Your daily visit limit is updated."),
        onError: (err: Error) => Alert.alert("Couldn't save", err.message),
      },
    );
  }

  const today = new Date();

  // Day-of-month numbers in the current month that already have a care visit
  // booked on them — driven by the nurse's real assignments, so activating a
  // case immediately lights up the calendar here.
  const bookedDays = useMemo(() => {
    const set = new Set<number>();
    const year = today.getFullYear();
    const month = today.getMonth();
    for (const a of assignments ?? []) {
      for (const v of a.visits) {
        const d = new Date(v.scheduledFor);
        if (d.getFullYear() === year && d.getMonth() === month) {
          set.add(d.getDate());
        }
      }
    }
    return set;
    // today is recreated each render; key off its date so this recomputes daily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, today.getFullYear(), today.getMonth()]);

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      {/* Header */}
      <View className="px-5 pb-3" style={{ paddingTop: top + 10 }}>
        <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
          My schedule
        </Text>
        <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
          Care visits follow Supracarer&apos;s schedule. You set how many short
          visits you can take in a day.
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
            {/* Policy note */}
            <View
              className="flex-row rounded-2xl p-4 mb-4"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
              <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
                Supracarer schedules care visits every day from {POLICY_START_LABEL}.
                Your available days and hours follow this policy — you don&apos;t
                manage them here.
              </Text>
            </View>

            {/* Available days (fixed by policy) */}
            <SectionLabel title="Available days" />
            <Card>
              <View className="flex-row" style={{ gap: 6 }}>
                {WEEKDAYS.map((d) => (
                  <View
                    key={d.code}
                    className="flex-1 items-center rounded-xl"
                    style={{ paddingVertical: 12, backgroundColor: GREEN }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>
                      {d.short}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="flex-row items-center" style={{ marginTop: 12 }}>
                <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                <Text style={{ color: "#6b7280", fontSize: 12, marginLeft: 6 }}>
                  Every day — care runs 7 days a week.
                </Text>
              </View>
            </Card>

            {/* Working hours (fixed by policy) */}
            <SectionLabel title="Working hours" />
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground" style={{ fontSize: 14, fontWeight: "500" }}>
                  Start time
                </Text>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
                    {POLICY_START_LABEL}
                  </Text>
                  <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                </View>
              </View>
              <View className="flex-row items-center" style={{ marginTop: 12 }}>
                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                <Text style={{ color: "#6b7280", fontSize: 12, marginLeft: 6, flex: 1 }}>
                  Each visit runs for the hours set by its care package.
                </Text>
              </View>
            </Card>

            {/* Max visits per day (the one editable setting) */}
            <SectionLabel title="Max visits per day" />
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-foreground" style={{ fontSize: 14, fontWeight: "500" }}>
                    Short visits a day
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                    For Wellness &amp; Daily Assist, how many families you can serve
                    in one day.
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
              <MonthPreview bookedDays={bookedDays} />
              <View className="flex-row items-center" style={{ marginTop: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN_LIGHT }} />
                <Text style={{ color: "#6b7280", fontSize: 12, marginLeft: 6 }}>
                  Booked care visit
                </Text>
              </View>
              {bookedDays.size === 0 && (
                <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
                  No care visits booked this month yet.
                </Text>
              )}
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
