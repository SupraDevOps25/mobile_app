import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { avatarColor, initialsOf } from "@/lib/avatar";
import { useCoordinatorLogs, useReviewLog } from "@/hooks/useCoordinator";
import type { ApiPatientMood, ApiVisitKind } from "@/services/visit.service";

const MOOD_LABEL: Record<ApiPatientMood, string> = {
  POOR: "Poor",
  LOW: "Low",
  GOOD: "Good",
  GREAT: "Great",
  EXCELLENT: "Excellent",
};

const KIND_LABEL: Record<ApiVisitKind, string> = {
  INITIAL_ASSESSMENT: "Initial assessment",
  CARE_VISIT: "Care visit",
};

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl px-3 py-3" style={{ width: "48%", backgroundColor: "#f3f4f6" }}>
      <Text className="text-muted font-semibold" style={{ fontSize: 10, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Text className="text-foreground font-bold" style={{ fontSize: 16, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

export default function CoordinatorLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: logs, isLoading } = useCoordinatorLogs();
  const log = logs?.find((l) => l.visitId === id);
  const reviewLog = useReviewLog();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0d9488" />
      </View>
    );
  }

  if (!log) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Log not found.</Text>
      </View>
    );
  }

  const reviewed = !!log.reviewedAt;
  const vitals = [
    { label: "Blood pressure", value: log.bloodPressure },
    { label: "Blood glucose", value: log.bloodGlucose },
    { label: "Heart rate", value: log.heartRate },
    { label: "Temperature", value: log.temperature },
  ].filter((v) => v.value && v.value.trim().length > 0) as {
    label: string;
    value: string;
  }[];

  function onReview() {
    reviewLog.mutate(log!.visitId, {
      onSuccess: () => Alert.alert("Reviewed", "This log is marked as reviewed."),
      onError: (err: Error) => Alert.alert("Couldn't review", err.message),
    });
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Visit log
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
      >
        {/* Patient banner */}
        <View className="flex-row items-center rounded-2xl p-4" style={{ backgroundColor: "#0f2461" }}>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: avatarColor(log.clientName) }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              {initialsOf(log.clientName)}
            </Text>
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {log.clientName}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
              {KIND_LABEL[log.visitKind]} · {new Date(log.scheduledFor).toLocaleDateString()} · {log.durationHrs} hrs
            </Text>
          </View>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: reviewed ? "rgba(148,163,184,0.3)" : "rgba(22,163,74,0.3)" }}
          >
            <Text style={{ color: reviewed ? "#cbd5e1" : "#4ade80", fontSize: 10, fontWeight: "600" }}>
              {reviewed ? "Reviewed" : "Pending"}
            </Text>
          </View>
        </View>

        <Text className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
          Submitted by {log.nurseName} on {new Date(log.submittedAt).toLocaleString()}
        </Text>

        {/* Summary */}
        <SectionLabel title="Visit summary" />
        <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
          <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
            {log.summary}
          </Text>
        </View>

        {/* Observations */}
        {log.observations && log.observations.trim().length > 0 && (
          <>
            <SectionLabel title="Observations" />
            <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
                {log.observations}
              </Text>
            </View>
          </>
        )}

        {/* Vitals */}
        {vitals.length > 0 && (
          <>
            <SectionLabel title="Vitals recorded" />
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {vitals.map((v) => (
                <Vital key={v.label} label={v.label} value={v.value} />
              ))}
            </View>
          </>
        )}

        {/* Medications */}
        {log.medicationsGiven.length > 0 && (
          <>
            <SectionLabel title="Medications administered" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {log.medicationsGiven.map((m) => (
                <View key={m} className="flex-row items-center rounded-full px-3 py-1.5" style={{ backgroundColor: "#eff6ff" }}>
                  <Ionicons name="medkit-outline" size={13} color="#2563eb" />
                  <Text style={{ color: "#1d4ed8", fontSize: 12, marginLeft: 5 }}>{m}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Quick log */}
        {log.quickLog.length > 0 && (
          <>
            <SectionLabel title="Quick log" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {log.quickLog.map((q) => (
                <View key={q} className="flex-row items-center rounded-full px-3 py-1.5" style={{ backgroundColor: "#f0fdf4" }}>
                  <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                  <Text style={{ color: "#15803d", fontSize: 12, marginLeft: 5 }}>{q}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Mood + flags */}
        <SectionLabel title="Assessment" />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {log.mood && (
            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#f3f4f6" }}>
              <Text style={{ color: "#374151", fontSize: 12, fontWeight: "600" }}>
                Mood: {MOOD_LABEL[log.mood]}
              </Text>
            </View>
          )}
          {log.followUpRecommended && (
            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#eff6ff" }}>
              <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "600" }}>
                Follow-up recommended
              </Text>
            </View>
          )}
          {log.escalationNeeded && (
            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#fef2f2" }}>
              <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>
                Escalation needed
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer action */}
      <View
        className="px-5 pt-3 bg-background"
        style={{ paddingBottom: bottom + 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
      >
        {reviewed ? (
          <View className="flex-row items-center justify-center" style={{ gap: 8, paddingVertical: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text className="text-muted" style={{ fontSize: 13 }}>
              Reviewed on  {new Date(log.reviewedAt!).toLocaleDateString()} 
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onReview}
            disabled={reviewLog.isPending}
            className="rounded-2xl items-center justify-center flex-row"
            style={{ backgroundColor: reviewLog.isPending ? "#9ca3af" : "#0d9488", paddingVertical: 16, gap: 8 }}
          >
            {reviewLog.isPending && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              Mark reviewed
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
