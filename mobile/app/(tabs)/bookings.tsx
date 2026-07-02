import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
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
import { MatchingView } from "@/components/care-plan/MatchingView";
import { PastCareCard } from "@/components/care-plan/PastCareCard";
import { RenewalCard } from "@/components/care-plan/RenewalCard";
import { SubscriptionHeaderCard } from "@/components/care-plan/SubscriptionHeaderCard";
import { TeamNurseRow } from "@/components/care-plan/TeamNurseRow";
import { VisitRow } from "@/components/care-plan/VisitRow";
import { toPackageView } from "@/constants/package-presentation";
import { usePackage } from "@/hooks/usePackages";
import {
  useActiveSubscription,
  useSubscriptionHistory,
} from "@/hooks/useSubscription";
import { useCarePlan } from "@/hooks/useVisits";
import type { ApiPastCare } from "@/services/subscription.service";

function PreviousCareSection({
  items,
  onOpen,
}: {
  items: ApiPastCare[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <SectionLabel title="Previous care" />
      {items.map((item) => (
        <PastCareCard key={item.id} item={item} onPress={(p) => onOpen(p.id)} />
      ))}
    </>
  );
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

function EmptyState() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: top + 24 }}>
      <Text className="text-foreground text-2xl font-bold mb-1">My care</Text>
      <View className="flex-1 items-center justify-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="heart-outline" size={36} color="#2563eb" />
        </View>
        <Text className="text-foreground font-bold text-center" style={{ fontSize: 17, marginTop: 16 }}>
          No active subscription
        </Text>
        <Text className="text-muted text-center" style={{ fontSize: 14, marginTop: 6, lineHeight: 20 }}>
          Subscribe to a care package to get a coordinated care team for your loved one.
        </Text>
        <Pressable
          onPress={() => router.push("/packages" as any)}
          className="rounded-2xl items-center justify-center py-3.5 px-8 mt-6"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            Browse packages
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CarePlanScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  const { data: subscription, isLoading } = useActiveSubscription();
  const { data: pkgData } = usePackage(subscription?.packageType);
  const { data: visits } = useCarePlan();
  const { data: pastCare } = useSubscriptionHistory();
  const history = pastCare ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  // No current plan. If they've received care before, still show that history
  // rather than a bare empty state.
  if (!subscription) {
    if (history.length === 0) return <EmptyState />;
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar style="dark" />
        <Text className="text-foreground font-bold px-5 mb-2" style={{ fontSize: 22 }}>
          My care
        </Text>
        <View className="px-5">
          <View
            className="rounded-2xl p-5 mb-2"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Text className="text-foreground font-semibold" style={{ fontSize: 15 }}>
              No active care plan
            </Text>
            <Text className="text-muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
              Start a new package anytime to bring back a coordinated care team.
            </Text>
            <Pressable
              onPress={() => router.push("/packages" as any)}
              className="rounded-xl items-center justify-center py-3 mt-4"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                Browse packages
              </Text>
            </Pressable>
          </View>
          <PreviousCareSection
            items={history}
            onOpen={(id) => router.push(`/past-care/${id}` as any)}
          />
        </View>
      </ScrollView>
    );
  }

  const pkg = pkgData ? toPackageView(pkgData) : undefined;
  const team = subscription.careTeam;
  const hasTeam = team.nurses.length > 0;
  const isMatching = subscription.status === "MATCHING" || !hasTeam;

  const upcoming = (visits ?? []).filter(
    (v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS",
  );
  const recent = (visits ?? []).filter(
    (v) => v.status === "COMPLETED" || v.status === "MISSED",
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
          My care plan
        </Text>
        <Pressable
          onPress={() => router.push("/invoices" as any)}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="receipt-outline" size={18} color="#374151" />
        </Pressable>
      </View>

      <View className="px-5">
        {pkg && (
          <SubscriptionHeaderCard pkg={pkg} subscription={subscription} />
        )}

        {subscription.status === "RENEWING" && (
          <RenewalCard subscription={subscription} />
        )}

        {isMatching ? (
          <MatchingView />
        ) : (
          <>
            {/* Care recipient */}
            <SectionLabel title="Care recipient" />
            <CareRecipientCard client={subscription.careRecipient} />

            {/* Coordinator */}
            {team.coordinator && (
              <>
                <SectionLabel title="Your Care Coordinator" />
                <CoordinatorCard coordinator={team.coordinator} />
              </>
            )}

            {/* Care team */}
            <SectionLabel title="Care team" />
            {team.nurses.map((nurse) => (
              <TeamNurseRow
                key={nurse.assignmentId}
                nurse={nurse}
                onPress={(n) => router.push(`/nurse/${n.assignmentId}` as any)}
              />
            ))}

            {/* Upcoming visits */}
            {upcoming.length > 0 && (
              <>
                <SectionLabel title="Upcoming visits" />
                {upcoming.map((visit) => (
                  <VisitRow key={visit.id} visit={visit} />
                ))}
              </>
            )}

            {/* Recent visits */}
            {recent.length > 0 && (
              <>
                <SectionLabel title="Recent visits" />
                {recent.map((visit) => (
                  <VisitRow key={visit.id} visit={visit} />
                ))}
              </>
            )}
          </>
        )}

        {/* Previous care received across past engagements */}
        <PreviousCareSection
          items={history}
          onOpen={(id) => router.push(`/past-care/${id}` as any)}
        />
      </View>
    </ScrollView>
  );
}
