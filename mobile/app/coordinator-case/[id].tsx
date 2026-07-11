import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import { rosterStatus } from "@/constants/coordinator-presentation";
import {
  ASSIGNMENT_ROLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import {
  useActivateCase,
  useCancelAssistant,
  useChangePackage,
  useCompleteAssessment,
  useCoordinatorCaseDetail,
  useCoordinatorCases,
  useIssueInvoice,
  useMatchAssistant,
  useRematchCase,
  useSetAssessment,
  useSetCareStart,
} from "@/hooks/useCoordinator";
import { useRefresh } from "@/hooks/useRefresh";
import { Avatar } from "@/components/ui/Avatar";
import { initialsOf } from "@/lib/avatar";
import type { ApiCoordinatorCaseVisit } from "@/services/coordinator.service";
import type { ApiPackageType } from "@/services/package.service";
import type { ApiVisitKind } from "@/services/visit.service";

const VISIT_KIND_LABEL: Record<ApiVisitKind, string> = {
  INITIAL_ASSESSMENT: "Home assessment",
  CARE_VISIT: "Care visit",
};

// Ordering for the "Care visits & logs" list: the initial home assessment
// always leads (it's the first step in the care journey), then in-progress
// visits, then logs (awaiting review, then reviewed), then upcoming, completed
// and missed.
function visitRank(v: ApiCoordinatorCaseVisit): number {
  if (v.kind === "INITIAL_ASSESSMENT") return 0;
  if (v.status === "IN_PROGRESS") return 1;
  if (v.hasLog && !v.logReviewed) return 2;
  if (v.hasLog && v.logReviewed) return 3;
  if (v.status === "SCHEDULED") return 4;
  if (v.status === "MISSED") return 6;
  return 5;
}

// A visit's badge reflects where its log stands in review, or its plain status
// when there's no nurse log (scheduled, in progress, missed, or the assessment).
function visitBadge(v: ApiCoordinatorCaseVisit): {
  label: string;
  bg: string;
  color: string;
} {
  if (v.status === "MISSED")
    return { label: "Missed", bg: "#fef2f2", color: "#dc2626" };
  if (v.hasLog) {
    if (v.logReviewed)
      return { label: "Reviewed", bg: "#f0fdf4", color: "#16a34a" };
    if (v.changesRequested)
      return { label: "Changes requested", bg: "#fef2f2", color: "#dc2626" };
    return { label: "Awaiting review", bg: "#fffbeb", color: "#b45309" };
  }
  if (v.status === "COMPLETED")
    return { label: "Completed", bg: "#f3f4f6", color: "#4b5563" };
  if (v.status === "IN_PROGRESS")
    return { label: "In progress", bg: "#eff6ff", color: "#2563eb" };
  return { label: "Scheduled", bg: "#f3f4f6", color: "#6b7280" };
}

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

const PACKAGE_TYPES: ApiPackageType[] = [
  "WELLNESS",
  "DAILY_ASSIST",
  "EXTENDED_ASSIST",
  "LIVE_IN",
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CoordinatorCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: cases, isLoading, refetch: refetchCases } =
    useCoordinatorCases();
  const item = cases?.find((c) => c.id === id);
  const { data: detail, refetch: refetchDetail } =
    useCoordinatorCaseDetail(id);
  const { refreshing, onRefresh } = useRefresh([refetchCases, refetchDetail]);
  // "What's included" starts collapsed so a long package list doesn't bury the
  // rest of the case; the coordinator expands it on demand.
  const [showIncluded, setShowIncluded] = useState(false);

  const setAssessment = useSetAssessment();
  const completeAssessment = useCompleteAssessment();
  const changePackage = useChangePackage();
  const setCareStart = useSetCareStart();
  const activate = useActivateCase();
  const issueInvoice = useIssueInvoice();
  const rematch = useRematchCase();
  const matchAssistant = useMatchAssistant();
  const cancelAssistant = useCancelAssistant();

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
  const assessmentDate = item.assessmentAt ? new Date(item.assessmentAt) : null;
  const careStartDate = item.careStartAt ? new Date(item.careStartAt) : null;
  const assessmentLabel = item.assessmentAt
    ? formatDateTime(item.assessmentAt)
    : null;
  const careStartLabel = item.careStartAt
    ? formatDateTime(item.careStartAt)
    : null;

  function onSetAssessment(d: Date) {
    setAssessment.mutate(
      { id: item!.id, assessmentAt: d.toISOString() },
      {
        onError: (err: Error) =>
          Alert.alert("Couldn't schedule assessment", err.message),
      },
    );
  }

  function onSetCareStart(d: Date) {
    setCareStart.mutate(
      { id: item!.id, careStartAt: d.toISOString() },
      { onError: (err: Error) => Alert.alert("Couldn't set date", err.message) },
    );
  }

  function onCompleteAssessment() {
    Alert.alert(
      "Mark assessment done",
      `Confirm the initial home visit for ${item!.recipient.name} has taken place. This lets you activate care.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark done",
          onPress: () =>
            completeAssessment.mutate(item!.id, {
              onError: (err: Error) =>
                Alert.alert("Couldn't update", err.message),
            }),
        },
      ],
    );
  }

  function onChangePackage(type: ApiPackageType) {
    if (type === item!.packageType) return;
    Alert.alert(
      "Change package",
      `Switch ${item!.recipient.name} to ${PACKAGE_LABELS[type]}? This re-prices the case and keeps the same care team.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: () =>
            changePackage.mutate(
              { id: item!.id, packageType: type },
              {
                onError: (err: Error) =>
                  Alert.alert("Couldn't change package", err.message),
              },
            ),
        },
      ],
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

  // Second-nurse state, derived from the roster.
  const assistant = item.roster.find((m) => m.role === "ASSISTANT");
  const assistantActive =
    assistant?.status === "ACCEPTED" || assistant?.status === "ACTIVE";
  const assistantPending = assistant?.status === "OFFERED";
  const assistantReady = !item.needsAssistant || assistantActive;

  const canSetCareStart =
    item.status === "TEAM_ASSIGNED" || item.status === "AWAITING_ACTIVATION";
  const canActivate =
    item.status === "AWAITING_ACTIVATION" &&
    !!item.careStartAt &&
    item.assessmentDone &&
    assistantReady;
  // Ready to activate except the assessment visit hasn't been completed yet.
  const awaitingAssessment =
    item.status === "AWAITING_ACTIVATION" &&
    !!item.careStartAt &&
    !item.assessmentDone;
  // Assessment done but the requested second nurse isn't on board yet.
  const awaitingAssistant =
    item.status === "AWAITING_ACTIVATION" &&
    !!item.careStartAt &&
    item.assessmentDone &&
    !assistantReady;
  const canInvoice = item.status === "ACTIVE" || item.status === "RENEWING";
  // Billing waits until this cycle's care is delivered: any visit still to come
  // or underway blocks the invoice (matches the API guard).
  const hasPendingVisits = (detail?.visits ?? []).some(
    (v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS",
  );

  function onMatchAssistant() {
    matchAssistant.mutate(item!.id, {
      onSuccess: () =>
        Alert.alert(
          "Second nurse offered",
          "An offer has been sent to an eligible nurse to share this rotation.",
        ),
      onError: (err: Error) =>
        Alert.alert("Couldn't assign", err.message),
    });
  }

  function onCancelAssistant() {
    Alert.alert(
      "Cancel second-nurse request",
      `Drop the request for a second nurse on ${item!.recipient.name}'s case? The lead nurse keeps the full pay and covers it solo.`,
      [
        { text: "Keep request", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: () =>
            cancelAssistant.mutate(item!.id, {
              onError: (err: Error) =>
                Alert.alert("Couldn't cancel", err.message),
            }),
        },
      ],
    );
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
          Case
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
            colors={["#0d9488"]}
          />
        }
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
            <Avatar
              name={item.recipient.name}
              initials={initialsOf(item.recipient.name)}
              photoUrl={item.family.photoUrl}
              size={52}
            />
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

        {/* Your fee — the coordinator's 8% share of this plan, per billing month */}
        <View
          className="flex-row items-center rounded-2xl p-4 mt-4"
          style={{ backgroundColor: "#f0fdfa", borderWidth: 1, borderColor: "#99f6e4" }}
        >
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: "#ccfbf1" }}
          >
            <Ionicons name="wallet-outline" size={19} color="#0d9488" />
          </View>
          <View className="flex-1 ml-3">
            <Text style={{ color: "#0f766e", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
              YOUR FEE · THIS PLAN
            </Text>
            <Text className="text-foreground font-bold" style={{ fontSize: 20, marginTop: 2 }}>
              GHS {item.coordinatorFeeGhs.toLocaleString()}
              <Text className="text-muted" style={{ fontSize: 12, fontWeight: "400" }}>
                {" "}
                /month
              </Text>
            </Text>
            <Text className="text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              8% of the GHS {item.priceGhs.toLocaleString()} plan · paid after the
              family settles each month
            </Text>
          </View>
        </View>

        {/* Care recipient */}
        <SectionLabel title="Care recipient" />
        <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
          {/* Gender · age · who care is for */}
          <View
            className="flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: "#f8fafc", gap: 10 }}
          >
            <View className="flex-1 items-center">
              <Text className="text-muted" style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4 }}>
                GENDER
              </Text>
              <Text className="text-foreground font-bold" style={{ fontSize: 14, marginTop: 3 }}>
                {item.recipient.gender === "MALE" ? "Male" : "Female"}
              </Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: "#e5e7eb" }} />
            <View className="flex-1 items-center">
              <Text className="text-muted" style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4 }}>
                AGE
              </Text>
              <Text className="text-foreground font-bold" style={{ fontSize: 14, marginTop: 3 }}>
                {item.recipient.age} yrs
              </Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: "#e5e7eb" }} />
            <View className="flex-1 items-center">
              <Text className="text-muted" style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.4 }}>
                CARE FOR
              </Text>
              <Text className="text-foreground font-bold" style={{ fontSize: 14, marginTop: 3 }}>
                {item.recipient.bookingFor === "SELF" ? "Self" : "Loved one"}
              </Text>
            </View>
          </View>

          {item.recipient.conditions.length > 0 && (
            <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
              {item.recipient.conditions.map((c) => (
                <View key={c} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#eef2ff" }}>
                  <Text style={{ color: "#3730a3", fontSize: 12, fontWeight: "500" }}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row mt-3" style={{ gap: 8 }}>
            <Ionicons name="document-text-outline" size={15} color="#6b7280" style={{ marginTop: 2 }} />
            <Text className="text-foreground flex-1" style={{ fontSize: 13, lineHeight: 20 }}>
              {item.recipient.basicCareNeeds}
            </Text>
          </View>
          <View
            className="flex-row items-center mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
          >
            <Ionicons name="location-outline" size={15} color="#6b7280" />
            <Text className="text-muted flex-1" style={{ fontSize: 13, marginLeft: 6 }}>
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
          <Avatar
            name={item.family.name}
            initials={initialsOf(item.family.name)}
            photoUrl={item.family.photoUrl}
            size={40}
          />
          <View className="flex-1 ml-3">
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

        {/* What the care package includes — collapsible to stay out of the way */}
        {detail && detail.inclusions.length > 0 && (
          <>
            <SectionLabel title="What's included" />
            <View
              className="bg-card rounded-2xl"
              style={{ borderWidth: 1, borderColor: "#f3f4f6", overflow: "hidden" }}
            >
              <Pressable
                onPress={() => setShowIncluded((s) => !s)}
                className="flex-row items-center p-4"
              >
                <View className="flex-1">
                  <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                    {detail.packageName ?? "Care package"}
                  </Text>
                  <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {detail.inclusions.length}{" "}
                    {detail.inclusions.length === 1 ? "item" : "items"} · GHS{" "}
                    {detail.priceGhs.toLocaleString()}/mo
                  </Text>
                </View>
                <Ionicons
                  name={showIncluded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#6b7280"
                />
              </Pressable>
              {showIncluded && (
                <View className="px-4 pb-4">
                  {detail.packageTagline && (
                    <Text className="text-muted" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 18 }}>
                      {detail.packageTagline}
                    </Text>
                  )}
                  <View style={{ gap: 9 }}>
                    {detail.inclusions.map((inc) => (
                      <View key={inc} className="flex-row" style={{ gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={17} color="#0d9488" />
                        <Text className="text-foreground" style={{ fontSize: 13.5, lineHeight: 19, flex: 1 }}>
                          {inc}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

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
                  <Avatar
                    name={m.name}
                    initials={m.initials}
                    photoUrl={m.photoUrl}
                    size={44}
                  />
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

        {/* Second nurse (full-time cases) */}
        {item.needsAssistant && (
          <>
            <SectionLabel title="Second nurse" />
            <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              {assistantActive ? (
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Ionicons name="people" size={17} color="#15803d" />
                  <Text style={{ color: "#15803d", fontSize: 13.5, fontWeight: "600", flex: 1 }}>
                    {assistant?.name} is sharing this rotation as the assistant
                    nurse.
                  </Text>
                </View>
              ) : assistantPending ? (
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Ionicons name="time-outline" size={17} color="#b45309" />
                  <Text style={{ color: "#92400e", fontSize: 13.5, lineHeight: 19, flex: 1 }}>
                    Offer sent to {assistant?.name} — awaiting their acceptance.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-foreground" style={{ fontSize: 13.5, lineHeight: 19 }}>
                    The lead nurse asked for a second nurse to share this
                    full-time rotation. Assign one to alternate the daily visits.
                  </Text>
                  <Pressable
                    onPress={onMatchAssistant}
                    disabled={matchAssistant.isPending}
                    className="rounded-2xl items-center justify-center mt-3 flex-row"
                    style={{ backgroundColor: matchAssistant.isPending ? "#9ca3af" : "#0d9488", paddingVertical: 13, gap: 8 }}
                  >
                    {matchAssistant.isPending && (
                      <ActivityIndicator color="#ffffff" size="small" />
                    )}
                    <Ionicons name="person-add-outline" size={16} color="#ffffff" />
                    <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                      Assign second nurse
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Cancel is available until a second nurse has actually joined. */}
              {!assistantActive && (
                <Pressable
                  onPress={onCancelAssistant}
                  disabled={cancelAssistant.isPending}
                  className="items-center mt-3"
                  hitSlop={6}
                >
                  <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600" }}>
                    Cancel second-nurse request
                  </Text>
                </Pressable>
              )}
            </View>
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
          <>
            {/* 1. Initial home visit (assessment) — item 4 */}
            <View className="bg-card rounded-2xl p-4" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                Initial home visit
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                Agree a date &amp; time with the nurse for the joint assessment.
                This first visit isn&apos;t bound by the 8:00 AM policy.
              </Text>
              {assessmentLabel && (
                <View className="flex-row items-center mt-2" style={{ gap: 6 }}>
                  <Ionicons
                    name={item.assessmentDone ? "checkmark-done-circle" : "calendar-outline"}
                    size={15}
                    color="#0f766e"
                  />
                  <Text style={{ color: "#0f766e", fontSize: 13, fontWeight: "600" }}>
                    {item.assessmentDone ? "Completed" : "Scheduled"} · {assessmentLabel}
                  </Text>
                </View>
              )}
              {!item.assessmentDone && (
                <View className="mt-3">
                  <DateTimeField
                    value={assessmentDate}
                    onChange={onSetAssessment}
                    minimumDate={new Date()}
                    placeholder="Pick assessment date & time"
                    disabled={setAssessment.isPending}
                  />
                </View>
              )}
              {item.assessmentAt && !item.assessmentDone && (
                <Pressable
                  onPress={onCompleteAssessment}
                  disabled={completeAssessment.isPending}
                  className="rounded-2xl items-center justify-center mt-3 flex-row"
                  style={{ borderWidth: 1, borderColor: "#0d9488", paddingVertical: 12, gap: 8 }}
                >
                  {completeAssessment.isPending && (
                    <ActivityIndicator color="#0d9488" size="small" />
                  )}
                  <Ionicons name="checkmark-circle-outline" size={16} color="#0d9488" />
                  <Text style={{ color: "#0d9488", fontWeight: "700", fontSize: 14 }}>
                    Mark assessment complete
                  </Text>
                </Pressable>
              )}
            </View>

            {/* 2. Package recommendation — item 5a */}
            <View className="bg-card rounded-2xl p-4 mt-3" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                Care package
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                Recommend a different package if the family&apos;s needs have
                changed at assessment. This re-prices the case and keeps the team.
              </Text>
              <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
                {PACKAGE_TYPES.map((type) => {
                  const active = item.packageType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => onChangePackage(type)}
                      disabled={changePackage.isPending}
                      className="rounded-full px-3 py-2 flex-row items-center"
                      style={{
                        borderWidth: 1,
                        borderColor: "#0d9488",
                        backgroundColor: active ? "#0d9488" : "transparent",
                        gap: 5,
                      }}
                    >
                      {active && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                      <Text
                        style={{
                          color: active ? "#ffffff" : "#0d9488",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {PACKAGE_LABELS[type]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
                Current price: GHS {item.priceGhs.toLocaleString()}/mo
              </Text>
            </View>

            {/* 3. Care start / commencement — item 5b */}
            <View className="bg-card rounded-2xl p-4 mt-3" style={{ borderWidth: 1, borderColor: "#f3f4f6" }}>
              <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                Care start date
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                The day &amp; time regular care begins, agreed with the family.
                Visits default to 8:00 AM — adjust here if they prefer another time.
              </Text>
              {careStartLabel && (
                <View className="flex-row items-center mt-2" style={{ gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#0f766e" />
                  <Text style={{ color: "#0f766e", fontSize: 13, fontWeight: "600" }}>
                    Starts · {careStartLabel}
                  </Text>
                </View>
              )}
              <View className="mt-3">
                <DateTimeField
                  value={careStartDate}
                  onChange={onSetCareStart}
                  minimumDate={new Date()}
                  placeholder="Pick care-start date & time"
                  disabled={setCareStart.isPending}
                />
              </View>
            </View>
          </>
        )}

        {awaitingAssessment && (
          <View className="flex-row rounded-2xl p-4 mt-3" style={{ backgroundColor: "#fffbeb" }}>
            <Ionicons name="time-outline" size={17} color="#b45309" />
            <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 19, marginLeft: 8, flex: 1 }}>
              Once the initial home visit has taken place, mark the assessment
              complete above to activate care.
            </Text>
          </View>
        )}

        {awaitingAssistant && (
          <View className="flex-row rounded-2xl p-4 mt-3" style={{ backgroundColor: "#fffbeb" }}>
            <Ionicons name="people-outline" size={17} color="#b45309" />
            <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 19, marginLeft: 8, flex: 1 }}>
              This case needs a second nurse — assign and confirm one (above)
              before activating care.
            </Text>
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
          <>
            <Pressable
              onPress={onIssueInvoice}
              disabled={issueInvoice.isPending || hasPendingVisits}
              className="rounded-2xl items-center justify-center mt-1 flex-row"
              style={{
                borderWidth: 1,
                borderColor: hasPendingVisits ? "#e5e7eb" : "#0d9488",
                paddingVertical: 15,
                gap: 8,
                opacity: hasPendingVisits ? 0.6 : 1,
              }}
            >
              {issueInvoice.isPending && <ActivityIndicator color="#0d9488" size="small" />}
              <Ionicons
                name="receipt-outline"
                size={17}
                color={hasPendingVisits ? "#9ca3af" : "#0d9488"}
              />
              <Text
                style={{
                  color: hasPendingVisits ? "#9ca3af" : "#0d9488",
                  fontWeight: "bold",
                  fontSize: 15,
                }}
              >
                Issue month-end invoice
              </Text>
            </Pressable>
            {hasPendingVisits && (
              <Text
                className="text-muted"
                style={{ fontSize: 12, marginTop: 6, textAlign: "center", lineHeight: 17 }}
              >
                Complete all care visits before issuing this month&apos;s invoice.
              </Text>
            )}
          </>
        )}

        {/* Care visits & logs — every visit on the case, active or not */}
        <SectionLabel title="Care visits & logs" />
        {!detail ? (
          <ActivityIndicator color="#0d9488" style={{ marginVertical: 12 }} />
        ) : detail.visits.length === 0 ? (
          <View
            className="bg-card rounded-2xl p-5 items-center"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <Ionicons name="calendar-clear-outline" size={22} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>
              No visits yet. They appear here once care is activated.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: 340 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {[...detail.visits]
              .sort((a, b) => visitRank(a) - visitRank(b))
              .map((v) => {
                const badge = visitBadge(v);
                const dateLabel = new Date(v.scheduledFor).toLocaleDateString([], {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                const row = (
                  <View
                    className="flex-row items-center bg-card rounded-2xl p-3 mb-2.5"
                    style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
                  >
                    <Avatar
                      name={v.nurseName}
                      initials={initialsOf(v.nurseName)}
                      photoUrl={v.nursePhotoUrl}
                      size={40}
                    />
                    <View className="flex-1 ml-3">
                  <Text className="text-foreground font-semibold" style={{ fontSize: 13.5 }}>
                    {VISIT_KIND_LABEL[v.kind]} · {dateLabel}
                  </Text>
                  <Text className="text-muted" style={{ fontSize: 11.5, marginTop: 1 }}>
                    {v.nurseName} · {v.durationHrs} hrs
                  </Text>
                </View>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: badge.bg }}>
                  <Text style={{ color: badge.color, fontSize: 10, fontWeight: "600" }}>
                    {badge.label}
                  </Text>
                </View>
                {v.hasLog && (
                  <Ionicons name="chevron-forward" size={15} color="#c4c9d1" style={{ marginLeft: 4 }} />
                )}
              </View>
            );
            return v.hasLog ? (
              <Pressable
                key={v.id}
                onPress={() => router.push(`/coordinator-log/${v.id}` as any)}
              >
                {row}
              </Pressable>
              ) : (
                <View key={v.id}>{row}</View>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}
