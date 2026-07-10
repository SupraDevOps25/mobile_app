import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CareRecipientCard } from "@/components/care-plan/CareRecipientCard";
import { CoordinatorCard } from "@/components/care-plan/CoordinatorCard";
import { NurseReviewCard } from "@/components/care-plan/NurseReviewCard";
import { RenewalCard } from "@/components/care-plan/RenewalCard";
import { TeamNurseRow } from "@/components/care-plan/TeamNurseRow";
import { VisitRow } from "@/components/care-plan/VisitRow";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import {
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import { useFamilyProfile } from "@/hooks/useFamily";
import { useRefresh } from "@/hooks/useRefresh";
import { usePendingReview } from "@/hooks/useReviews";
import { usePastCareDetail } from "@/hooks/useSubscription";
import type {
  ApiPastCareDetail,
  ApiSubscriptionStatus,
} from "@/services/subscription.service";
import type { ApiCarePlanVisit, ApiVisitStatus } from "@/services/visit.service";

// Care Visits ordering: in progress first, then completed, then scheduled,
// missed last. Within a status, soonest/oldest first.
const VISIT_STATUS_RANK: Record<ApiVisitStatus, number> = {
  IN_PROGRESS: 0,
  COMPLETED: 1,
  SCHEDULED: 2,
  MISSED: 3,
};

function sortVisits(visits: ApiCarePlanVisit[]): ApiCarePlanVisit[] {
  return [...visits].sort((a, b) => {
    const rank = VISIT_STATUS_RANK[a.status] - VISIT_STATUS_RANK[b.status];
    if (rank !== 0) return rank;
    return (
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  });
}

// The status pill shown on the summary card: gray "Ended" for a past plan,
// otherwise the live subscription status (Active, Renewing, …).
function statusChip(status: ApiSubscriptionStatus): {
  bg: string;
  color: string;
  label: string;
} {
  if (status === "CANCELLED")
    return { bg: "rgba(148,163,184,0.25)", color: "#cbd5e1", label: "Ended" };
  const p = subscriptionStatusPill(status);
  return { bg: p.bg, color: p.color, label: SUBSCRIPTION_STATUS_LABELS[status] };
}

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

function LoadedDetail({
  detail,
  refetchDetail,
}: {
  detail: ApiPastCareDetail;
  refetchDetail: () => Promise<unknown>;
}) {
  const router = useRouter();
  const { data: family, refetch: refetchFamily } = useFamilyProfile();
  const { data: pendingReview, refetch: refetchReview } = usePendingReview();
  const { refreshing, onRefresh } = useRefresh([
    refetchDetail,
    refetchFamily,
    refetchReview,
  ]);
  const ended = detail.status === "CANCELLED";
  const chip = statusChip(detail.status);
  const visits = sortVisits(detail.visits);
  // A mandatory nurse review is due when this engagement's cycle is complete.
  const reviewDue =
    !!pendingReview && pendingReview.subscriptionId === detail.id;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1e3a8a"
          colors={["#1e3a8a"]}
        />
      }
    >
      {/* Summary */}
      <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
        <View className="flex-row items-center justify-between">
          <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
            {ended ? "PAST CARE PLAN" : "CARE PLAN"}
          </Text>
          <View className="rounded-full px-3 py-1" style={{ backgroundColor: chip.bg }}>
            <Text style={{ color: chip.color, fontSize: 11, fontWeight: "600" }}>
              {chip.label}
            </Text>
          </View>
        </View>
        <Text className="text-white font-bold" style={{ fontSize: 20, marginTop: 8 }}>
          {detail.packageName ?? PACKAGE_LABELS[detail.packageType]}
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
          {ended
            ? `${fmtDate(detail.startedAt)} – ${fmtDate(detail.endedAt)}`
            : `Since ${fmtDate(detail.startedAt)}`}
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

      {/* Mandatory nurse review(s) once the cycle is complete — lead + assistant */}
      {reviewDue &&
        pendingReview &&
        pendingReview.caregivers.map((cg) => (
          <NurseReviewCard
            key={cg.caregiverId}
            subscriptionId={pendingReview.subscriptionId}
            packageName={pendingReview.packageName}
            caregiver={cg}
          />
        ))}

      {/* Renewal decision — unlocked only after the nurse has been rated */}
      {detail.status === "RENEWING" && !reviewDue && (
        <RenewalCard subscription={detail} />
      )}

      {/* Care recipient */}
      <SectionLabel title="Care recipient" />
      <CareRecipientCard
        client={detail.careRecipient}
        photoUrl={family?.photoUrl}
      />

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

      {/* Care Visits — in progress first, then completed, then scheduled.
          Capped height so a full month's schedule scrolls within its section. */}
      {visits.length > 0 && (
        <>
          <SectionLabel title="Care Visits" />
          <ScrollView
            style={{ maxHeight: 340 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {visits.map((visit) => (
              <VisitRow key={visit.id} visit={visit} />
            ))}
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}

export default function PastCareDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: detail, isLoading, refetch } = usePastCareDetail(id);
  const title =
    detail && detail.status !== "CANCELLED" ? "Care plan" : "Care history";

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
          {title}
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
        <LoadedDetail detail={detail} refetchDetail={refetch} />
      )}
    </View>
  );
}
