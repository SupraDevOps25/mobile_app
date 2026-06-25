import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CareRecipientCard } from "@/components/care-plan/CareRecipientCard";
import { CoordinatorCard } from "@/components/care-plan/CoordinatorCard";
import { MatchingView } from "@/components/care-plan/MatchingView";
import { SubscriptionHeaderCard } from "@/components/care-plan/SubscriptionHeaderCard";
import { TeamNurseRow } from "@/components/care-plan/TeamNurseRow";
import { VisitRow } from "@/components/care-plan/VisitRow";
import { getActiveSubscription, type Visit } from "@/constants/care";
import { getPackage } from "@/constants/packages";

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

  const subscription = getActiveSubscription();
  if (!subscription) return <EmptyState />;

  const pkg = getPackage(subscription.package);
  if (!pkg) return <EmptyState />;

  const isMatching = subscription.status === "matching";
  const team = subscription.careTeam;

  const upcoming = subscription.visits.filter(
    (v) => v.status === "scheduled" || v.status === "in-progress",
  );
  const recent = subscription.visits.filter(
    (v) => v.status === "completed" || v.status === "missed",
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
          onPress={() => Alert.alert("Manage subscription", "Subscription management is coming soon.")}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="settings-outline" size={18} color="#374151" />
        </Pressable>
      </View>

      <View className="px-5">
        <SubscriptionHeaderCard pkg={pkg} subscription={subscription} />

        {isMatching || !team ? (
          <MatchingView />
        ) : (
          <>
            {/* Care recipient */}
            <SectionLabel title="Care recipient" />
            <CareRecipientCard client={subscription.client} />

            {/* Coordinator */}
            <SectionLabel title="Your Care Coordinator" />
            <CoordinatorCard coordinator={team.coordinator} />

            {/* Care team */}
            <SectionLabel title="Care team" />
            {team.members.map((member) => (
              <TeamNurseRow
                key={member.nurse.id}
                member={member}
                onPress={(nurse) => router.push(`/nurse/${nurse.id}` as any)}
              />
            ))}

            {/* Upcoming visits */}
            {upcoming.length > 0 && (
              <>
                <SectionLabel title="Upcoming visits" />
                {upcoming.map((visit: Visit) => (
                  <VisitRow key={visit.id} visit={visit} />
                ))}
              </>
            )}

            {/* Recent visits */}
            {recent.length > 0 && (
              <>
                <SectionLabel title="Recent visits" />
                {recent.map((visit: Visit) => (
                  <VisitRow key={visit.id} visit={visit} />
                ))}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
