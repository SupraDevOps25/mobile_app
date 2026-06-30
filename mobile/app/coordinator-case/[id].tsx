import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import { rosterStatus } from "@/constants/coordinator-presentation";
import {
  ASSIGNMENT_ROLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import {
  useActivateCase,
  useCoordinatorCases,
  useIssueInvoice,
  useRematchCase,
  useSetCareStart,
} from "@/hooks/useCoordinator";
import { avatarColor, initialsOf } from "@/lib/avatar";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 12 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

// 08:00 local time, N days from today, as an ISO string for the backend.
function atEightAm(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const CARE_START_OPTIONS: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 2 days", days: 2 },
  { label: "In 3 days", days: 3 },
];

export default function CoordinatorCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: cases, isLoading } = useCoordinatorCases();
  const item = cases?.find((c) => c.id === id);

  const setCareStart = useSetCareStart();
  const activate = useActivateCase();
  const issueInvoice = useIssueInvoice();
  const rematch = useRematchCase();
  // Which care-start option is currently selected (instant highlight on tap).
  const [pickedDays, setPickedDays] = useState<number | null>(null);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0d9488" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Case not found.</Text>
      </View>
    );
  }

  const pill = subscriptionStatusPill(item.status);
  const careStartLabel = item.careStartAt
    ? new Date(item.careStartAt).toLocaleString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  // Highlight the option matching the saved date, unless one was just tapped.
  const savedDays = item.careStartAt
    ? (CARE_START_OPTIONS.find((o) =>
        sameDay(new Date(atEightAm(o.days)), new Date(item.careStartAt!)),
      )?.days ?? null)
    : null;
  const activeDays = pickedDays ?? savedDays;

  function onSetCareStart(days: number) {
    setPickedDays(days); // instant active state
    setCareStart.mutate(
      { id: item!.id, careStartAt: atEightAm(days) },
      {
        onError: (err: Error) => {
          setPickedDays(null); // revert highlight on failure
          Alert.alert("Couldn't set date", err.message);
        },
      },
    );
  }

  function onActivate() {
    Alert.alert(
      "Activate care",
      "This generates the visit schedule and notifies the family. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: () =>
            activate.mutate(item!.id, {
              onSuccess: () => Alert.alert("Care activated", "The visit schedule is live."),
              onError: (err: Error) => Alert.alert("Couldn't activate", err.message),
            }),
        },
      ],
    );
  }

  function onRematch() {
    Alert.alert(
      "Re-match a new nurse",
      "The system will run matching again and offer a different primary nurse. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Re-match",
          onPress: () =>
            rematch.mutate(item!.id, {
              onSuccess: () =>
                Alert.alert("Re-matching", "A new nurse is being offered the case."),
              onError: (err: Error) => Alert.alert("Couldn't re-match", err.message),
            }),
        },
      ],
    );
  }

  function onIssueInvoice() {
    Alert.alert(
      "Issue invoice",
      `Issue this month's invoice (GHS ${item!.priceGhs.toLocaleString()}) to ${item!.family.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Issue",
          onPress: () =>
            issueInvoice.mutate(item!.id, {
              onSuccess: () =>
                Alert.alert("Invoice issued", "The family has been notified to pay."),
              onError: (err: Error) => Alert.alert("Couldn't issue", err.message),
            }),
        },
      ],
    );
  }

  const canSetCareStart =
    item.status === "TEAM_ASSIGNED" || item.status === "AWAITING_ACTIVATION";
  const canActivate = item.status === "AWAITING_ACTIVATION" && !!item.careStartAt;
  const canInvoice = item.status === "ACTIVE" || item.status === "RENEWING";

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
          Case
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
      >
        {/* Recipient + status */}
        <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
          <View className="flex-row items-center justify-between">
            <Text style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1 }}>
              {PACKAGE_LABELS[item.packageType].toUpperCase()}
            </Text>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: pill.bg }}>
              <Text style={{ color: pill.color, fontSize: 11, fontWeight: "600" }}>
                {SUBSCRIPTION_STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mt-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(item.recipient.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                {initialsOf(item.recipient.name)}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                {item.recipient.name}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 1 }}>
                {item.recipient.age} yrs · {item.recipient.area}, {item.recipient.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Conditions + needs */}
        <SectionLabel title="Care recipient" />
        <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {item.recipient.conditions.map((c) => (
              <View key={c} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#f3f4f6" }}>
                <Text style={{ color: "#374151", fontSize: 12, fontWeight: "500" }}>{c}</Text>
              </View>
            ))}
          </View>
          <Text className="text-foreground" style={{ fontSize: 13, lineHeight: 20, marginTop: 12 }}>
            {item.recipient.basicCareNeeds}
          </Text>
          <View className="flex-row items-center mt-3">
            <Ionicons name="location-outline" size={15} color="#6b7280" />
            <Text className="text-muted" style={{ fontSize: 13, marginLeft: 6 }}>
              {item.recipient.address}
            </Text>
          </View>
        </View>

        {/* Family contact */}
        <SectionLabel title="Family contact" />
        <View
          className="flex-row items-center bg-card rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <View className="flex-1">
            <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
              {item.family.name}
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              Account holder
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`tel:${item.family.phone}`)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
            hitSlop={6}
          >
            <Ionicons name="call-outline" size={17} color="#2563eb" />
          </Pressable>
        </View>

        {/* Matched nurses (roster) */}
        {item.roster.length > 0 && (
          <>
            <SectionLabel title="Matched nurses" />
            {item.roster.map((m) => {
              const st = rosterStatus(m.status, m.expiresAt);
              return (
                <View
                  key={m.assignmentId}
                  className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
                  style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                >
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: avatarColor(m.name) }}
                  >
                    <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                      {m.initials}
                    </Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                      {m.name}
                    </Text>
                    <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                      <Text className="text-muted" style={{ fontSize: 12 }}>
                        {ASSIGNMENT_ROLE_LABELS[m.role]}
                      </Text>
                      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
                        <Text style={{ color: st.color, fontSize: 10, fontWeight: "600" }}>
                          {st.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${m.phone}`)}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#eff6ff" }}
                    hitSlop={6}
                  >
                    <Ionicons name="call-outline" size={17} color="#2563eb" />
                  </Pressable>
                </View>
              );
            })}

            {item.status === "MATCHING" && (
              <Pressable
                onPress={onRematch}
                disabled={rematch.isPending}
                className="rounded-2xl items-center justify-center mt-1 flex-row"
                style={{ borderWidth: 1, borderColor: "#0d9488", paddingVertical: 14, gap: 8 }}
              >
                {rematch.isPending && <ActivityIndicator color="#0d9488" size="small" />}
                <Ionicons name="refresh" size={16} color="#0d9488" />
                <Text style={{ color: "#0d9488", fontWeight: "bold", fontSize: 14 }}>
                  Re-match with a different primary
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* Actions */}
        <SectionLabel title="Next steps" />

        {item.status === "MATCHING" && (
          <View className="rounded-2xl p-4" style={{ backgroundColor: "#fffbeb" }}>
            <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 19 }}>
              We&apos;re matching a care team. You&apos;ll be able to set the care-start
              date once a nurse accepts.
            </Text>
          </View>
        )}

        {canSetCareStart && (
          <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
            <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
              {careStartLabel ? "Care starts" : "Set the care-start date"}
            </Text>
            {careStartLabel ? (
              <Text style={{ color: "#0f766e", fontSize: 14, fontWeight: "600", marginTop: 4 }}>
                {careStartLabel}
              </Text>
            ) : (
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                Captured at the assessment visit (08:00).
              </Text>
            )}
            <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
              {CARE_START_OPTIONS.map((opt) => {
                const active = activeDays === opt.days;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => onSetCareStart(opt.days)}
                    disabled={setCareStart.isPending}
                    className="rounded-full px-3 py-2 flex-row items-center"
                    style={{
                      borderWidth: 1,
                      borderColor: "#0d9488",
                      backgroundColor: active ? "#0d9488" : "transparent",
                      gap: 5,
                    }}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={13} color="#ffffff" />
                    )}
                    <Text
                      style={{
                        color: active ? "#ffffff" : "#0d9488",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {canActivate && (
          <Pressable
            onPress={onActivate}
            disabled={activate.isPending}
            className="rounded-2xl items-center justify-center mt-3 flex-row"
            style={{ backgroundColor: activate.isPending ? "#9ca3af" : "#0d9488", paddingVertical: 15, gap: 8 }}
          >
            {activate.isPending && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              Activate care
            </Text>
          </Pressable>
        )}

        {item.status === "ACTIVE" && item.activatedAt && (
          <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#f0fdf4" }}>
            <Text style={{ color: "#15803d", fontSize: 13 }}>
              Care active since {new Date(item.activatedAt).toLocaleDateString()}.
            </Text>
          </View>
        )}

        {canInvoice && (
          <Pressable
            onPress={onIssueInvoice}
            disabled={issueInvoice.isPending}
            className="rounded-2xl items-center justify-center mt-1 flex-row"
            style={{ borderWidth: 1, borderColor: "#0d9488", paddingVertical: 15, gap: 8 }}
          >
            {issueInvoice.isPending && <ActivityIndicator color="#0d9488" size="small" />}
            <Ionicons name="receipt-outline" size={17} color="#0d9488" />
            <Text style={{ color: "#0d9488", fontWeight: "bold", fontSize: 15 }}>
              Issue month-end invoice
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
