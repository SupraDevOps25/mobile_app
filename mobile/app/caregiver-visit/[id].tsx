import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { useVisit } from "@/hooks/useVisits";
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

export default function CaregiverVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: visit, isLoading } = useVisit(id);

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
        <Text className="text-muted">Visit not found.</Text>
      </View>
    );
  }

  const client = visit.client;
  const log = visit.log;
  const dateLabel = new Date(visit.scheduledFor).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const canEdit = !!log && !log.reviewedAt;
  const reviewed = !!log?.reviewedAt;

  const vitals = log
    ? ([
        { label: "Blood pressure", value: log.bloodPressure },
        { label: "Blood glucose", value: log.bloodGlucose },
        { label: "Heart rate", value: log.heartRate },
        { label: "Temperature", value: log.temperature },
      ].filter((v) => v.value && v.value.trim().length > 0) as {
        label: string;
        value: string;
      }[])
    : [];

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
          Visit details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
      >
        {/* Patient banner */}
        <View className="flex-row items-center rounded-2xl p-4" style={{ backgroundColor: "#0f2461" }}>
          <Avatar
            name={client.name}
            initials={client.initials}
            photoUrl={client.photoUrl}
            size={48}
          />
          <View className="flex-1 ml-3">
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {client.name}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
              {KIND_LABEL[visit.kind]} · {dateLabel} · {visit.durationHrs} hrs
            </Text>
          </View>
        </View>

        {/* Where + care needs */}
        <SectionLabel title="Location" />
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text className="text-foreground" style={{ fontSize: 14, marginLeft: 6 }}>
            {[client.address, client.area, client.city].filter(Boolean).join(", ")}
          </Text>
        </View>

        {client.conditions.length > 0 && (
          <>
            <SectionLabel title="Conditions" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {client.conditions.map((c) => (
                <View key={c} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#f3f4f6" }}>
                  <Text style={{ color: "#374151", fontSize: 12, fontWeight: "500" }}>{c}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Changes-requested banner */}
        {log?.changesRequested && (
          <View className="rounded-2xl p-4 mt-5" style={{ backgroundColor: "#fef2f2" }}>
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text className="font-bold" style={{ color: "#dc2626", fontSize: 13, marginLeft: 6 }}>
                Changes requested
              </Text>
            </View>
            {log.reviewNotes.length > 0 ? (
              log.reviewNotes.map((n, i) => (
                <View key={i} className="flex-row mt-1.5" style={{ gap: 6 }}>
                  <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "700" }}>
                    {i + 1}.
                  </Text>
                  <Text style={{ color: "#b91c1c", fontSize: 13, lineHeight: 19, flex: 1 }}>
                    {n}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: "#b91c1c", fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                Your Care Coordinator asked you to revise this log.
              </Text>
            )}
          </View>
        )}

        {/* The log */}
        {log ? (
          <>
            <SectionLabel title="Visit summary" />
            <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
                {log.summary}
              </Text>
            </View>

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
                  <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "600" }}>Follow-up recommended</Text>
                </View>
              )}
              {log.escalationNeeded && (
                <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#fef2f2" }}>
                  <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>Escalation needed</Text>
                </View>
              )}
            </View>

            <Text className="text-muted" style={{ fontSize: 12, marginTop: 16 }}>
              {reviewed
                ? `Reviewed by your Coordinator on ${new Date(log.reviewedAt!).toLocaleDateString()}`
                : `Submitted ${new Date(log.submittedAt).toLocaleString()}`}
            </Text>
          </>
        ) : (
          <View className="items-center" style={{ marginTop: 40 }}>
            <Ionicons name="document-outline" size={28} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 8 }}>
              No care log was submitted for this visit.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit affordance */}
      {canEdit && (
        <View
          className="px-5 pt-3 bg-background"
          style={{ paddingBottom: bottom + 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
        >
          <Pressable
            onPress={() =>
              router.push({ pathname: "/care-report/[id]" as any, params: { id: visit.id } })
            }
            className="rounded-2xl items-center justify-center flex-row"
            style={{ backgroundColor: "#1e3a8a", paddingVertical: 16, gap: 8 }}
          >
            <Ionicons name="create-outline" size={18} color="#ffffff" />
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              {log?.changesRequested ? "Edit & resubmit" : "Edit log"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
