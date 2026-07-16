import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { VisitRowCard } from "@/components/ui/VisitRowCard";
import { useRefresh } from "@/hooks/useRefresh";
import { useCaregiverAssignments } from "@/hooks/useVisits";
import type {
  ApiAssignmentVisit,
  ApiCaregiverAssignment,
} from "@/services/visit.service";

// Shared card look across the app: gray border + a soft shadow (matches the
// Visits and Schedule screens).
const CARD_BORDER = "#ebedf0";
const CARD_SHADOW = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.04,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

const KIND_LABEL: Record<ApiAssignmentVisit["kind"], string> = {
  INITIAL_ASSESSMENT: "Initial assessment",
  CARE_VISIT: "Care visit",
};

const ROLE_LABEL: Record<ApiCaregiverAssignment["role"], string> = {
  PRIMARY: "Lead nurse",
  BACKUP_1: "Backup nurse",
  BACKUP_2: "Backup nurse",
};

type Category = "pending" | "submitted" | "reviewed" | "missed";

function categoryOf(v: ApiAssignmentVisit): Category {
  if (v.logReviewed) return "reviewed";
  if (v.hasLog) return "submitted";
  if (v.status === "MISSED") return "missed";
  return "pending";
}

function visitBadge(v: ApiAssignmentVisit): { label: string; color: string; bg: string } {
  const cat = categoryOf(v);
  if (cat === "reviewed") return { label: "Reviewed", color: "#15803d", bg: "#f0fdf4" };
  if (cat === "submitted")
    return v.changesRequested
      ? { label: "Changes requested", color: "#dc2626", bg: "#fef2f2" }
      : { label: "Submitted", color: "#b45309", bg: "#fffbeb" };
  if (cat === "missed") return { label: "Missed", color: "#dc2626", bg: "#fef2f2" };
  return v.status === "IN_PROGRESS"
    ? { label: "In progress", color: "#1d4ed8", bg: "#eff6ff" }
    : { label: "Not started", color: "#6b7280", bg: "#f3f4f6" };
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 20, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

// A labelled stat inside the dark navy family banner.
function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ color: "#94a3b8", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text
        style={{ color: "#ffffff", fontSize: 14, fontWeight: "700", marginTop: 3, textAlign: "center" }}
      >
        {value}
      </Text>
    </View>
  );
}

function VisitCard({
  v,
  onPress,
}: {
  v: ApiAssignmentVisit;
  onPress: (v: ApiAssignmentVisit) => void;
}) {
  const time = new Date(v.scheduledFor).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <VisitRowCard
      dateISO={v.scheduledFor}
      title={KIND_LABEL[v.kind]}
      subtitle={`${time} · ${v.durationHrs} hrs`}
      badge={visitBadge(v)}
      chevron
      onPress={() => onPress(v)}
    />
  );
}

// A visit group whose list scrolls inside a capped height, so a long run of
// visits (e.g. 26 pending) stays compact instead of stretching the page.
function VisitGroup({
  title,
  visits,
  onPress,
}: {
  title: string;
  visits: ApiAssignmentVisit[];
  onPress: (v: ApiAssignmentVisit) => void;
}) {
  if (visits.length === 0) return null;
  // Card is 76 tall + 12 margin ≈ 88; cap at ~4 cards, then scroll inside.
  const capped = visits.length > 4;
  return (
    <>
      <SectionLabel title={title} />
      <ScrollView
        style={capped ? { maxHeight: 352 } : undefined}
        scrollEnabled={capped}
        nestedScrollEnabled
        showsVerticalScrollIndicator={capped}
        contentContainerStyle={{ paddingBottom: 2 }}
      >
        {visits.map((v) => (
          <VisitCard key={v.id} v={v} onPress={onPress} />
        ))}
      </ScrollView>
    </>
  );
}

export default function CaregiverAssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: assignments, isLoading, refetch } = useCaregiverAssignments();
  const { refreshing, onRefresh } = useRefresh(refetch);
  const item = assignments?.find((a) => a.assignmentId === id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }
  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Assignment not found.</Text>
      </View>
    );
  }

  const c = item.client;
  const pending = item.visits.filter((v) => categoryOf(v) === "pending");
  const submitted = item.visits.filter((v) => categoryOf(v) === "submitted");
  const reviewed = item.visits.filter((v) => categoryOf(v) === "reviewed");
  const missed = item.visits.filter((v) => categoryOf(v) === "missed");

  function openVisit(v: ApiAssignmentVisit) {
    const cat = categoryOf(v);
    if (cat === "pending") {
      router.push({
        pathname: "/(caregiver-tabs)/active-visit" as any,
        params: { id: v.id },
      });
    } else {
      router.push({ pathname: "/caregiver-visit/[id]" as any, params: { id: v.id } });
    }
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
          Assignment
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={["#16a34a"]}
          />
        }
      >
        {/* Family banner */}
        <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
          <View className="flex-row items-center">
            <Avatar
              name={c.name}
              initials={c.initials}
              photoUrl={c.photoUrl}
              size={56}
            />
            <View className="flex-1" style={{ marginLeft: 14 }}>
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <Ionicons name="people" size={12} color="#93c5fd" />
                <Text style={{ color: "#93c5fd", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
                  FAMILY
                </Text>
              </View>
              <Text className="text-white font-bold" style={{ fontSize: 18, marginTop: 2 }}>
                {c.name}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <Text style={{ color: "#e2e8f0", fontSize: 10, fontWeight: "700" }}>
                {ROLE_LABEL[item.role]}
              </Text>
            </View>
          </View>

          {/* Gender · age · package */}
          <View
            className="flex-row items-center rounded-2xl p-3.5 mt-4"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <BannerStat label="GENDER" value={c.gender === "MALE" ? "Male" : "Female"} />
            <View style={{ width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" }} />
            <BannerStat label="AGE" value={`${c.age} yrs`} />
            <View style={{ width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" }} />
            <BannerStat label="PACKAGE" value={item.packageName ?? item.packageType} />
          </View>

          {/* Visit address */}
          <View className="flex-row items-center mt-3">
            <Ionicons name="location" size={15} color="#93c5fd" />
            <Text style={{ color: "#cbd5e1", fontSize: 12.5, lineHeight: 18, marginLeft: 7, flex: 1 }}>
              {[c.address, c.area, c.city].filter(Boolean).join(", ")}
            </Text>
          </View>

          {/* Care coordinator */}
          {item.coordinatorName && (
            <View
              className="flex-row items-center mt-3 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }}
            >
              <Ionicons name="shield-checkmark" size={16} color="#93c5fd" />
              <View style={{ flex: 1, marginLeft: 7, minWidth: 0 }}>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                  Care Coordinator
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 13.5,
                    fontWeight: "800",
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.coordinatorName}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Conditions */}
        {c.conditions.length > 0 && (
          <View className="flex-row flex-wrap mt-4" style={{ gap: 8 }}>
            {c.conditions.map((cond) => (
              <View key={cond} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "#f3f4f6" }}>
                <Text style={{ color: "#374151", fontSize: 12, fontWeight: "500" }}>{cond}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What's included in this care package */}
        {item.inclusions.length > 0 && (
          <>
            <Text
              className="text-muted font-semibold"
              style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
            >
              WHAT&apos;S INCLUDED
            </Text>
            <View
              className="bg-card rounded-2xl px-4 py-1"
              style={{ borderWidth: 1, borderColor: CARD_BORDER, ...CARD_SHADOW }}
            >
              {item.inclusions.map((inc, i) => (
                <View
                  key={inc}
                  className="flex-row items-center py-3"
                  style={
                    i === item.inclusions.length - 1
                      ? undefined
                      : { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }
                  }
                >
                  <Ionicons name="checkmark-circle" size={17} color="#16a34a" />
                  <Text className="text-foreground flex-1" style={{ fontSize: 13.5, marginLeft: 9 }}>
                    {inc}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* The family's review + star rating for this nurse */}
        {item.review && (
          <>
            <Text
              className="text-muted font-semibold"
              style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
            >
              FAMILY REVIEW
            </Text>
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: CARD_BORDER, ...CARD_SHADOW }}
            >
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= item.review!.rating ? "star" : "star-outline"}
                    size={18}
                    color="#f59e0b"
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text className="text-foreground font-bold" style={{ fontSize: 14, marginLeft: 6 }}>
                  {item.review.rating.toFixed(1)}
                </Text>
              </View>
              {item.review.comment ? (
                <Text
                  className="text-foreground"
                  style={{ fontSize: 13.5, lineHeight: 20, marginTop: 10 }}
                >
                  &ldquo;{item.review.comment}&rdquo;
                </Text>
              ) : (
                <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                  No written comment left.
                </Text>
              )}
              <Text className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>
                Reviewed {new Date(item.review.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </>
        )}

        {/* Visits, grouped by state */}
        {item.visits.length === 0 ? (
          <View className="items-center" style={{ marginTop: 40 }}>
            <Ionicons name="calendar-outline" size={26} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 8 }}>
              No visits have been scheduled for this case yet.
            </Text>
          </View>
        ) : (
          <>
            <VisitGroup
              title={`Pending · ${pending.length}`}
              visits={pending}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Submitted · ${submitted.length}`}
              visits={submitted}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Reviewed · ${reviewed.length}`}
              visits={reviewed}
              onPress={openVisit}
            />
            <VisitGroup
              title={`Missed · ${missed.length}`}
              visits={missed}
              onPress={openVisit}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
