import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import { useRefresh } from "@/hooks/useRefresh";
import {
  useActiveSubscription,
  usePastCareDetail,
} from "@/hooks/useSubscription";
import { avatarColor } from "@/lib/avatar";
import type { ApiNurseReview } from "@/services/subscription.service";

const REVIEW_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function reviewDate(iso: string): string {
  const d = new Date(iso);
  return `${REVIEW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={13}
          color={n <= rating ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </View>
  );
}

function ReviewRow({ review }: { review: ApiNurseReview }) {
  return (
    <View
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center justify-between">
        <Stars rating={review.rating} />
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {reviewDate(review.createdAt)}
        </Text>
      </View>
      {review.comment ? (
        <Text className="text-foreground" style={{ fontSize: 13.5, lineHeight: 20, marginTop: 8 }}>
          &ldquo;{review.comment}&rdquo;
        </Text>
      ) : null}
      <Text className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
        {PACKAGE_LABELS[review.packageType]}
      </Text>
    </View>
  );
}

function Stat({
  value,
  label,
  icon,
  color,
  bg,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View
        className="rounded-full items-center justify-center"
        style={{ width: 32, height: 32, backgroundColor: bg, marginBottom: 8, borderRadius: 16 }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text
        className="text-foreground font-bold"
        style={{ fontSize: 18, lineHeight: 23 }}
      >
        {value}
      </Text>
      <Text
        className="text-muted text-center"
        style={{
          fontSize: 11,
          lineHeight: 15,
          marginTop: 2,
          minWidth: 0,
          width: "100%",
        }}
      >
        {label}
      </Text>
    </View>
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

function GoodToKnowItem({
  icon,
  label,
  color,
  bg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderRadius: 999,
        flexShrink: 0,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
    >
      <Ionicons name={icon} size={15} color={color} />
      <Text
        style={{
          color,
          flexShrink: 1,
          fontSize: 12,
          fontWeight: "600",
          lineHeight: 18,
          marginLeft: 6,
          minWidth: 0,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function NurseProfileScreen() {
  // `sub` is set when opening a nurse from a past (ended) engagement, so we can
  // look them up in that engagement's team rather than the active plan.
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: subscription, isLoading, refetch: refetchSub } =
    useActiveSubscription();
  const { data: pastDetail, isLoading: pastLoading, refetch: refetchPast } =
    usePastCareDetail(sub);
  const { refreshing, onRefresh } = useRefresh([refetchSub, refetchPast]);
  const nurse =
    subscription?.careTeam.nurses.find((n) => n.assignmentId === id) ??
    pastDetail?.careTeam.nurses.find((n) => n.assignmentId === id);
  const isLead = nurse?.role === "PRIMARY";

  // Only wait on the source we actually navigated from — a past engagement's
  // nurse comes from the (already-cached) pastDetail, so we must not block on
  // the unrelated active-subscription query. And if the nurse already resolved
  // from cache, show them immediately instead of flashing a spinner.
  const sourceLoading = sub ? pastLoading : isLoading;
  if (!nurse && sourceLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  if (!nurse) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Nurse not found.</Text>
      </View>
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
          Nurse profile
        </Text>
      </View>

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
        {/* Hero */}
        <View className="items-center" style={{ marginTop: 8 }}>
          {nurse.photoUrl ? (
            <Image
              source={{ uri: nurse.photoUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(nurse.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 24 }}>
                {nurse.initials}
              </Text>
            </View>
          )}
          <View className="flex-row items-center" style={{ marginTop: 12 }}>
            <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
              {nurse.name}
            </Text>
            {nurse.licenseVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2563eb" style={{ marginLeft: 5 }} />
            )}
          </View>
          <Text
            className="text-muted text-center"
            style={{
              alignSelf: "stretch",
              flexShrink: 1,
              fontSize: 13,
              lineHeight: 18,
              marginTop: 2,
              minWidth: 0,
            }}
          >
            {nurse.qualification ?? "Nurse"}
          </Text>
          <View
            className="rounded-full px-3 py-1 mt-3"
            style={{ backgroundColor: isLead ? "#dcfce7" : "#f3f4f6" }}
          >
            <Text
              style={{
                color: isLead ? "#16a34a" : "#6b7280",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {ASSIGNMENT_ROLE_LABELS[nurse.role]}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View
          className="flex-row bg-card rounded-2xl py-4 mt-6"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <Stat
            value={`${nurse.yearsExperience} yrs`}
            label="Experience"
            icon="briefcase-outline"
            color="#1d4ed8"
            bg="#eff6ff"
          />
          <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
          <Stat
            value={`${nurse.rating.toFixed(1)}`}
            label={
              nurse.totalReviews > 0
                ? `${nurse.totalReviews} ${nurse.totalReviews === 1 ? "review" : "reviews"}`
                : "Rating"
            }
            icon="star-outline"
            color="#d97706"
            bg="#fffbeb"
          />
          <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
          <Stat
            value={`${nurse.reliabilityScore}%`}
            label="Reliability"
            icon="shield-checkmark-outline"
            color="#16a34a"
            bg="#f0fdf4"
          />
        </View>

        {/* About the nurse */}
        {nurse.bio && nurse.bio.trim().length > 0 && (
          <>
            <SectionLabel title="About" />
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <Text className="text-foreground" style={{ fontSize: 13.5, lineHeight: 20 }}>
                {nurse.bio}
              </Text>
            </View>
          </>
        )}

        {/* Reviews from families — real ratings the nurse has received */}
        {nurse.reviews.length > 0 && (
          <>
            <View
              className="flex-row items-center justify-between"
              style={{ marginTop: 24, marginBottom: 12 }}
            >
              <Text
                className="text-muted font-semibold"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                REVIEWS
              </Text>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Ionicons name="star" size={13} color="#f59e0b" />
                <Text className="text-foreground font-semibold" style={{ fontSize: 12.5 }}>
                  {nurse.rating.toFixed(1)} · {nurse.totalReviews}{" "}
                  {nurse.totalReviews === 1 ? "review" : "reviews"}
                </Text>
              </View>
            </View>
            {nurse.reviews.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </>
        )}

        {/* Languages spoken — matters for comfort and communication */}
        {nurse.languages.length > 0 && (
          <>
            <SectionLabel title="Speaks" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {nurse.languages.map((lang) => (
                <View
                  key={lang}
                  className="flex-row items-center rounded-full"
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#f3f4f6",
                    flexShrink: 0,
                    minHeight: 34,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={13}
                    color="#6b7280"
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      color: "#374151",
                      flexShrink: 0,
                      fontSize: 12,
                      includeFontPadding: true,
                      lineHeight: 20,
                      marginLeft: 4,
                      minWidth: 0,
                      paddingRight: 3,
                    }}
                  >
                    {lang}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Good to know — gender, homecare experience, verification */}
        {(nurse.gender || nurse.hasHomecareExp || nurse.licenseVerified) && (
          <>
            <SectionLabel title="Good to know" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {nurse.gender && (
                <GoodToKnowItem
                  icon={nurse.gender === "FEMALE" ? "female-outline" : "male-outline"}
                  label={nurse.gender === "FEMALE" ? "Female" : "Male"}
                  color="#1d4ed8"
                  bg="#eff6ff"
                />
              )}
              {nurse.hasHomecareExp && (
                <GoodToKnowItem
                  icon="home-outline"
                  label="Homecare experienced"
                  color="#15803d"
                  bg="#f0fdf4"
                />
              )}
              {nurse.licenseVerified && (
                <GoodToKnowItem
                  icon="shield-checkmark-outline"
                  label="Licence verified"
                  color="#1d4ed8"
                  bg="#eff6ff"
                />
              )}
            </View>
          </>
        )}

        {/* Service areas (proximity) */}
        {nurse.serviceAreas.length > 0 && (
          <>
            <SectionLabel title="Service areas" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {nurse.serviceAreas.map((area) => (
                <View
                  key={area}
                  className="flex-row items-center rounded-full"
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "#f3f4f6",
                    flexShrink: 0,
                    minHeight: 34,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color="#6b7280"
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      color: "#374151",
                      flexShrink: 0,
                      fontSize: 12,
                      includeFontPadding: true,
                      lineHeight: 20,
                      marginLeft: 4,
                      minWidth: 0,
                      paddingRight: 3,
                    }}
                  >
                    {area}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Communication note — families coordinate through the Coordinator */}
        <View
          className="flex-row rounded-2xl p-4 mt-6"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
          <Text
            style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
          >
            All scheduling and communication is handled by your Care Coordinator to
            ensure continuity and quality of care.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
