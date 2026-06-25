import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssignmentClientCard } from "@/components/assignment/AssignmentClientCard";
import { AssignmentEarningsCard } from "@/components/assignment/AssignmentEarningsCard";
import { ASSIGNMENT_ROLE_LABELS, getAssignment } from "@/constants/assignments";
import { getCompetencyLabel } from "@/constants/competencies";
import { getPackage } from "@/constants/packages";

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

export default function AssignmentOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const assignment = getAssignment(id);

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Assignment offer not found.</Text>
      </View>
    );
  }

  const pkg = getPackage(assignment.package);
  const isPrimary = assignment.role === "primary";
  const roleLabel = ASSIGNMENT_ROLE_LABELS[assignment.role];

  const banner = isPrimary
    ? { bg: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a", title: "#15803d" }
    : { bg: "#eff6ff", border: "#bfdbfe", icon: "#2563eb", title: "#1d4ed8" };

  function handleAccept() {
    Alert.alert(
      "Accept assignment",
      `Accept the ${roleLabel.toLowerCase()} role for ${assignment!.clientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () =>
            Alert.alert(
              "Assignment accepted",
              `You're now the ${roleLabel.toLowerCase()} for ${assignment!.clientName}. Your Care Coordinator and the family have been notified.`,
              [{ text: "OK", onPress: () => router.back() }],
            ),
        },
      ],
    );
  }

  function handleDecline() {
    Alert.alert(
      "Decline assignment",
      "Are you sure? This case will be offered to another nurse.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Decline", style: "destructive", onPress: () => router.back() },
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
            {pkg?.name} · {assignment.schedule}
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
          <DetailRow icon="briefcase-outline" label="Package" value={pkg?.name ?? "—"} />
          <DetailRow icon="time-outline" label="Schedule" value={assignment.schedule} />
          <DetailRow
            icon="calendar-outline"
            label="Start date"
            value={assignment.startDate}
            isLast
          />
        </View>

        {/* Matched competencies */}
        <SectionLabel title="Matched on your competencies" />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {assignment.requiredCompetencies.map((c) => (
            <View
              key={c}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "500" }}>
                {getCompetencyLabel(c)}
              </Text>
            </View>
          ))}
        </View>

        {/* Care needs */}
        <SectionLabel title="Care needs" />
        <View
          className="bg-card rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
            {assignment.basicCareNeeds}
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
            value={`${assignment.area}, ${assignment.city} · ${assignment.distanceKm} km away`}
          />
          <DetailRow
            icon="person-outline"
            label="Care Coordinator"
            value={assignment.coordinatorName}
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
          className="rounded-full items-center justify-center px-6 py-4"
          style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
        >
          <Text className="text-muted font-semibold" style={{ fontSize: 15 }}>
            Decline
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAccept}
          className="flex-1 rounded-full items-center justify-center py-4"
          style={{ backgroundColor: "#16a34a" }}
        >
          <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
            Accept assignment
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
