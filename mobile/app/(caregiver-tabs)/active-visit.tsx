import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickLogGrid, QUICK_LOG_ITEMS } from "@/components/active-visit/QuickLogGrid";
import { TimerCard } from "@/components/active-visit/TimerCard";
import { Avatar } from "@/components/ui/Avatar";
import { useStartVisit, useVisit } from "@/hooks/useVisits";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold mb-2"
      style={{ fontSize: 11, letterSpacing: 1 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function ActiveVisitScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: visit, isLoading } = useVisit(id);
  const startVisit = useStartVisit(id ?? "");

  const [logged, setLogged] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Track whether the scheduled visit time has elapsed. This stays true after
  // the auto-end alert is dismissed, so a nurse who navigates away and returns
  // still has a clear way to proceed to the care report.
  const [timeOver, setTimeOver] = useState(false);
  useEffect(() => {
    const isStarted = visit?.status === "IN_PROGRESS";
    if (!isStarted || !visit?.startedAt) {
      setTimeOver(false);
      return;
    }
    const endMs =
      new Date(visit.startedAt).getTime() + visit.durationHrs * 3600 * 1000;
    const check = () => setTimeOver(Date.now() >= endMs);
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [visit?.status, visit?.startedAt, visit?.durationHrs]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  if (!visit) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">No active visit.</Text>
      </View>
    );
  }

  const client = visit.client;
  const visitId = visit.id;
  const started = visit.status === "IN_PROGRESS";
  const scheduledLabel = new Date(visit.scheduledFor).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  function handleStart() {
    startVisit.mutate(undefined, {
      onError: (err: Error) => Alert.alert("Couldn't start visit", err.message),
    });
  }

  function toggleLog(itemId: string) {
    setLogged((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
    );
  }

  // Carry the quick-log labels and typed care notes into the care report.
  function goToReport() {
    const quickLog = QUICK_LOG_ITEMS.filter((i) => logged.includes(i.id))
      .map((i) => i.label)
      .join(",");
    router.push({
      pathname: `/care-report/${visitId}` as any,
      params: { notes, quickLog },
    });
  }

  function handleEndVisit() {
    Alert.alert("End visit", "End this visit and fill in the care report?", [
      { text: "Cancel", style: "cancel" },
      { text: "End visit", onPress: goToReport },
    ]);
  }

  // The visit runs only for its scheduled duration. When the time is up we
  // auto-end it, let the caregiver know, and take them straight to the report.
  function handleAutoEnd() {
    Alert.alert(
      "Visit time complete",
      `The scheduled ${visit?.durationHrs}-hour visit has ended. Please complete the care report.`,
      [{ text: "Fill report", onPress: goToReport }],
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 bg-white"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-foreground font-bold" style={{ fontSize: 18 }}>
          {started ? "Active visit" : "Visit"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 220 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {started ? (
          <TimerCard
            durationHrs={visit.durationHrs}
            startedAt={visit.startedAt}
            onEndVisit={handleEndVisit}
            onAutoEnd={handleAutoEnd}
          />
        ) : (
          <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
            <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
              SCHEDULED VISIT
            </Text>
            <Text className="text-white font-bold" style={{ fontSize: 18, marginTop: 8 }}>
              {scheduledLabel}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
              {visit.durationHrs} hour visit · not started yet
            </Text>
            <Pressable
              onPress={handleStart}
              disabled={startVisit.isPending}
              className="rounded-2xl items-center justify-center mt-4 flex-row"
              style={{
                backgroundColor: startVisit.isPending ? "#9ca3af" : "#16a34a",
                paddingVertical: 14,
                gap: 8,
              }}
            >
              {startVisit.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="play" size={16} color="#ffffff" />
              )}
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                Start visit
              </Text>
            </Pressable>
          </View>
        )}

        {/* Family card */}
        <View
          className="bg-card rounded-2xl p-4 mt-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <View className="flex-row items-center">
            <Avatar
              name={client.name}
              initials={client.initials}
              photoUrl={client.photoUrl}
              size={52}
            />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
                {client.name}
              </Text>
              <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                {client.age} yrs · {client.gender === "MALE" ? "Male" : "Female"}
              </Text>
            </View>
          </View>

          {/* Visit address */}
          <View
            className="flex-row items-center rounded-xl p-3 mt-3"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <Ionicons name="location" size={16} color="#2563eb" />
            <Text
              className="text-foreground flex-1"
              style={{ fontSize: 13, lineHeight: 18, marginLeft: 8 }}
            >
              {[client.address, client.area, client.city].filter(Boolean).join(", ")}
            </Text>
          </View>

          {client.conditions.length > 0 && (
            <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
              {client.conditions.map((c) => (
                <View
                  key={c}
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: "#f3f4f6" }}
                >
                  <Text style={{ color: "#374151", fontSize: 11, fontWeight: "600" }}>
                    {c}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick log + care notes — only once the visit has started */}
        {started && (
          <>
            <View className="mt-5">
              <SectionLabel title="Quick log" />
              <QuickLogGrid logged={logged} onToggle={toggleLog} />
            </View>

            <View className="mt-5">
              <SectionLabel title="Care notes" />
              <View
                className="bg-card rounded-2xl p-4"
                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
              >
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Write notes about the patient's condition, medication given, activities completed…"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  className="text-foreground"
                  style={{ fontSize: 14, lineHeight: 21, minHeight: 90, padding: 0 }}
                />
              </View>
            </View>

            {/* Once the scheduled time is up, a persistent way to finish — so a
                nurse returning to this screen doesn't have to tap "End visit". */}
            {timeOver && (
              <View className="mt-5">
                <View
                  className="flex-row items-center rounded-xl px-4 py-3 mb-3"
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <Text
                    style={{ color: "#15803d", fontSize: 12.5, marginLeft: 8, flex: 1, lineHeight: 18 }}
                  >
                    Visit time is complete. Finish by filling in the care report.
                  </Text>
                </View>
                <Pressable
                  onPress={goToReport}
                  className="rounded-2xl items-center justify-center flex-row"
                  style={{ backgroundColor: "#16a34a", paddingVertical: 16, gap: 8 }}
                >
                  <Ionicons name="clipboard-outline" size={18} color="#ffffff" />
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    Complete care report
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* Emergency assistance */}
        <View
          className="flex-row items-center rounded-2xl p-4 mt-5"
          style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#fecaca" }}
        >
          <Ionicons name="warning-outline" size={20} color="#dc2626" />
          <View className="flex-1 ml-3">
            <Text style={{ color: "#dc2626", fontSize: 14, fontWeight: "700" }}>
              Emergency assistance
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              Call for immediate help if needed
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL("tel:999")}
            className="rounded-full px-4 py-2.5"
            style={{ backgroundColor: "#dc2626" }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 13 }}>
              Call 999
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
