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
  useRequestAssistant,
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
  const requestAssistant = useRequestAssistant();
  const busy =
    accept.isPending || decline.isPending || requestAssistant.isPending;

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

  // Full-time packages the lead nurse can't realistically cover solo.
  const isFullTimePackage =
    assignment.packageType === "EXTENDED_ASSIST" ||
    assignment.packageType === "LIVE_IN";

  function finishAccept() {
    Alert.alert(
      "Assignment accepted",
      `You're now the ${roleLabel.toLowerCase()} for ${assignment!.client.name}. Your Care Coordinator and the family have been notified.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  function promptSecondNurse() {
    const shareNote =
      assignment!.sharedPayoutGhs != null
        ? ` Your pay is then shared equally — GHS ${assignment!.sharedPayoutGhs.toLocaleString()} each per month.`
        : "";
    Alert.alert(
      "Will you need a second nurse?",
      `Full-time care usually runs on a two-nurse rotation.${shareNote} Would you like a second nurse to share the shifts?`,
      [
        { text: "No, I'll manage", onPress: finishAccept },
        {
          text: "Yes, I'll need one",
          onPress: () =>
            requestAssistant.mutate(assignment!.id, {
              onSuccess: () =>
                Alert.alert(
                  "Second nurse requested",
                  "Your Care Coordinator will arrange a second nurse to share the rotation with you.",
                  [{ text: "OK", onPress: () => router.back() }],
                ),
              onError: (err: Error) =>
                Alert.alert("Couldn't send request", err.message, [
                  { text: "OK", onPress: () => router.back() },
                ]),
            }),
        },
      ],
    );
  }

  function handleAccept() {
    accept.mutate(assignment!.id, {
      onSuccess: () => {
        // Only the lead nurse on a full-time case is asked; an assistant isn't.
        if (isFullTimePackage && assignment!.role !== "ASSISTANT") {
          promptSecondNurse();
        } else {
          finishAccept();
        }
      },
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

        {/* Family */}
        <SectionLabel title="Family" />
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
            label="Each visit"
            value={
              assignment.visitDurationHrs != null
                ? `${assignment.visitDurationHrs} hrs · mornings from 8:00 AM`
                : "Mornings from 8:00 AM"
            }
          />
          <DetailRow
            icon="repeat-outline"
            label="Visits this month"
            value={
              assignment.visitsPerCycle != null
                ? `${assignment.visitsPerCycle} visits`
                : "—"
            }
          />
          <DetailRow
            icon="calendar-outline"
            label="Start date"
            value={formatDate(assignment.startDate)}
            isLast
          />
        </View>

        {/* What's included */}
        {assignment.inclusions.length > 0 && (
          <>
            <SectionLabel title="What's included" />
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              {assignment.inclusions.map((inc, i) => (
                <View
                  key={inc}
                  className="flex-row items-start"
                  style={{ marginTop: i === 0 ? 0 : 10 }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text
                    className="text-foreground flex-1"
                    style={{ fontSize: 13.5, lineHeight: 19, marginLeft: 8 }}
                  >
                    {inc}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

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

        {/* Family contact */}
        <SectionLabel title="Family contact" />
        <View
          className="flex-row items-center bg-card rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="call" size={18} color="#2563eb" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-muted" style={{ fontSize: 12 }}>
              {assignment.family.name}
            </Text>
            <Text
              className="text-foreground font-bold"
              style={{ fontSize: 15, marginTop: 1 }}
            >
              {assignment.family.phone}
            </Text>
          </View>
        </View>

        {/* Earnings */}
        <SectionLabel title="Earnings" />
        <AssignmentEarningsCard assignment={assignment} />

        {/* Availability prompt */}
        <View
          className="rounded-2xl p-4 mt-5 flex-row"
          style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" }}
        >
          <Ionicons name="help-circle-outline" size={20} color="#16a34a" />
          <Text
            style={{ color: "#15803d", fontSize: 13, lineHeight: 19, marginLeft: 8, flex: 1 }}
          >
            Are you available to take this on? Accepting confirms you can deliver
            these morning visits for {assignment.client.name}.
          </Text>
        </View>
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
