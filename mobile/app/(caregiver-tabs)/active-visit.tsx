import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { avatarColor } from "@/lib/avatar";
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
  const startedRef = useRef(false);

  const [logged, setLogged] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Begin the visit on the backend the first time the screen opens (if it
  // hasn't already started). The timer is presentational.
  useEffect(() => {
    if (!visit || startedRef.current) return;
    if (visit.status === "SCHEDULED") {
      startedRef.current = true;
      startVisit.mutate();
    }
  }, [visit, startVisit]);

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

  function toggleLog(itemId: string) {
    setLogged((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
    );
  }

  function handleEndVisit() {
    // Carry the quick-log labels and notes into the care report.
    const quickLog = QUICK_LOG_ITEMS.filter((i) => logged.includes(i.id))
      .map((i) => i.label)
      .join(",");
    Alert.alert("End visit", "End this visit and fill in the care report?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End visit",
        onPress: () =>
          router.push({
            pathname: `/care-report/${visitId}` as any,
            params: { notes, quickLog },
          }),
      },
    ]);
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
          Active visit
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <TimerCard durationHrs={visit.durationHrs} onEndVisit={handleEndVisit} />

        {/* Patient card */}
        <View
          className="bg-card rounded-2xl p-4 mt-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <View className="flex-row items-center">
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(client.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                {client.initials}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                {client.name}
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
                {client.age} yrs · {client.area}
              </Text>
            </View>
          </View>
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
        </View>

        {/* Quick log */}
        <View className="mt-5">
          <SectionLabel title="Quick log" />
          <QuickLogGrid logged={logged} onToggle={toggleLog} />
        </View>

        {/* Care notes */}
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
