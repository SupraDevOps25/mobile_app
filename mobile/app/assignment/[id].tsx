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
import { AssignmentClientCard } from "@/components/assignment/AssignmentClientCard";
import { AssignmentEarningsCard } from "@/components/assignment/AssignmentEarningsCard";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import {
  useAcceptOffer,
  useAssignment,
  useDeclineOffer,
} from "@/hooks/useAssignments";

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

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-3"
      style={isLast ? undefined : { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: "#eff6ff" }}
      >
        <Ionicons name={icon} size={16} color="#2563eb" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {label}
        </Text>
        <Text
          className="text-foreground font-semibold"
          style={{ fontSize: 14, marginTop: 1 }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "To be confirmed";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AssignmentOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: assignment, isLoading } = useAssignment(id);
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();
  const busy = accept.isPending || decline.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Assignment offer not found.</Text>
      </View>
    );
  }

  const isPrimary = assignment.role === "PRIMARY";
  const roleLabel = ASSIGNMENT_ROLE_LABELS[assignment.role];

  const banner = isPrimary
    ? { bg: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a", title: "#15803d" }
    : { bg: "#eff6ff", border: "#bfdbfe", icon: "#2563eb", title: "#1d4ed8" };

  function handleAccept() {
    accept.mutate(assignment!.id, {
      onSuccess: () =>
        Alert.alert(
          "Assignment accepted",
          `You're now the ${roleLabel.toLowerCase()} for ${assignment!.client.name}. Your Care Coordinator and the family have been notified.`,
          [{ text: "OK", onPress: () => router.back() }],
        ),
      onError: (err: Error) => Alert.alert("Couldn't accept", err.message),
    });
  }

  function handleDecline() {
    Alert.alert(
      "Decline assignment",
      "Are you sure? This case will be offered to another nurse.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () =>
            decline.mutate(assignment!.id, {
              onSuccess: () => router.back(),
              onError: (err: Error) =>
                Alert.alert("Couldn't decline", err.message),
            }),
        },
      ],
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
          Assignment offer
        </Text>
        <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}>New</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Role banner */}
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: banner.bg, borderWidth: 1, borderColor: banner.border }}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={isPrimary ? "ribbon-outline" : "shield-checkmark-outline"}
              size={20}
              color={banner.icon}
            />
            <Text
              style={{ color: banner.title, fontSize: 15, fontWeight: "700", marginLeft: 8 }}
            >
              You&apos;ve been matched as {roleLabel}
            </Text>
          </View>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 19 }}>
            {assignment.packageName ?? "Care package"}
            {assignment.schedule ? ` · ${assignment.schedule}` : ""}
          </Text>
        </View>

        {/* Client */}
        <SectionLabel title="Client" />
        <AssignmentClientCard assignment={assignment} />

        {/* Package & schedule */}
        <SectionLabel title="Package & schedule" />
        <View
          className="bg-card rounded-2xl px-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <DetailRow
            icon="briefcase-outline"
            label="Package"
            value={assignment.packageName ?? "—"}
          />
          <DetailRow
            icon="time-outline"
            label="Schedule"
            value={assignment.schedule ?? "—"}
          />
          <DetailRow
            icon="calendar-outline"
            label="Start date"
            value={formatDate(assignment.startDate)}
            isLast
          />
        </View>

        {/* Care needs */}
        <SectionLabel title="Care needs" />
        <View
          className="bg-card rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
            {assignment.client.basicCareNeeds}
          </Text>
        </View>

        {/* Details */}
        <SectionLabel title="Details" />
        <View
          className="bg-card rounded-2xl px-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <DetailRow
            icon="location-outline"
            label="Location"
            value={`${assignment.client.area}, ${assignment.client.city}`}
          />
          <DetailRow
            icon="person-outline"
            label="Care Coordinator"
            value={assignment.coordinatorName ?? "To be assigned"}
            isLast
          />
        </View>

        {/* Earnings */}
        <SectionLabel title="Earnings" />
        <AssignmentEarningsCard assignment={assignment} />
      </ScrollView>

      {/* Footer */}
      <View
        className="flex-row bg-white px-5 pt-3"
        style={{
          paddingBottom: bottom + 12,
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={handleDecline}
          disabled={busy}
          className="rounded-full items-center justify-center px-6 py-4"
          style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
        >
          <Text className="text-muted font-semibold" style={{ fontSize: 15 }}>
            Decline
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAccept}
          disabled={busy}
          className="flex-1 rounded-full items-center justify-center py-4 flex-row"
          style={{ backgroundColor: busy ? "#86efac" : "#16a34a", gap: 8 }}
        >
          {accept.isPending && <ActivityIndicator color="#ffffff" size="small" />}
          <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
            Accept assignment
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
