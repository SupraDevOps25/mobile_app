import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CareRecipientCard } from "@/components/care-plan/CareRecipientCard";
import { CoordinatorCard } from "@/components/care-plan/CoordinatorCard";
import { TeamNurseRow } from "@/components/care-plan/TeamNurseRow";
import { VisitRow } from "@/components/care-plan/VisitRow";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import { usePastCareDetail } from "@/hooks/useSubscription";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 12 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="text-white font-bold" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function PastCareDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: detail, isLoading } = usePastCareDetail(id);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-3"
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
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Care history
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : !detail ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="document-outline" size={30} color="#9ca3af" />
          <Text className="text-muted text-center" style={{ fontSize: 14, marginTop: 10 }}>
            We couldn&apos;t load this care record.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          {/* Summary */}
          <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
            <View className="flex-row items-center justify-between">
              <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
                PAST CARE PLAN
              </Text>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(148,163,184,0.25)" }}>
                <Text style={{ color: "#cbd5e1", fontSize: 11, fontWeight: "600" }}>
                  Ended
                </Text>
              </View>
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 20, marginTop: 8 }}>
              {detail.packageName ?? PACKAGE_LABELS[detail.packageType]}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
              {fmtDate(detail.startedAt)} – {fmtDate(detail.endedAt)}
            </Text>

            <View
              className="flex-row mt-5 pt-4"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }}
            >
              <Stat value={`GHS ${detail.priceGhs.toLocaleString()}`} label="Monthly" />
              <Stat value={String(detail.completedVisits)} label="Visits done" />
              <Stat value={String(detail.totalVisits)} label="Visits planned" />
            </View>
          </View>

          {/* Care recipient */}
          <SectionLabel title="Care recipient" />
          <CareRecipientCard client={detail.careRecipient} />

          {/* Coordinator */}
          {detail.careTeam.coordinator && (
            <>
              <SectionLabel title="Care Coordinator" />
              <CoordinatorCard coordinator={detail.careTeam.coordinator} />
            </>
          )}

          {/* Care team */}
          {detail.careTeam.nurses.length > 0 && (
            <>
              <SectionLabel title="Care team" />
              {detail.careTeam.nurses.map((nurse) => (
                <TeamNurseRow
                  key={nurse.assignmentId}
                  nurse={nurse}
                  onPress={(n) =>
                    router.push(`/nurse/${n.assignmentId}?sub=${detail.id}` as any)
                  }
                />
              ))}
            </>
          )}

          {/* Visits */}
          {detail.visits.length > 0 && (
            <>
              <SectionLabel title="Visit history" />
              {detail.visits.map((visit) => (
                <VisitRow key={visit.id} visit={visit} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
