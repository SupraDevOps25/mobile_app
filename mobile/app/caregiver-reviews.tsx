import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
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
import { CARD_SURFACE } from "@/components/ui/AppCard";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import { useCaregiverReviews } from "@/hooks/useCaregiverProfile";
import { useRefresh } from "@/hooks/useRefresh";
import type { ApiCaregiverReview } from "@/services/caregiver.service";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={size}
          color={n <= rating ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ApiCaregiverReview }) {
  return (
    <View className="bg-card rounded-2xl p-4 mb-3" style={CARD_SURFACE}>
      <View className="flex-row items-center justify-between">
        <Stars rating={review.rating} />
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {fmtDate(review.createdAt)}
        </Text>
      </View>
      {review.comment ? (
        <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 20, marginTop: 10 }}>
          &ldquo;{review.comment}&rdquo;
        </Text>
      ) : (
        <Text className="text-muted" style={{ fontSize: 13, fontStyle: "italic", marginTop: 10 }}>
          No comment left.
        </Text>
      )}
      <View
        className="flex-row items-center mt-3 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6", gap: 6 }}
      >
        <Ionicons name="person-outline" size={13} color="#9ca3af" />
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {review.recipientName} · {PACKAGE_LABELS[review.packageType]}
        </Text>
      </View>
    </View>
  );
}

export default function CaregiverReviewsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data, isLoading, refetch } = useCaregiverReviews();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const avg = data && data.totalReviews > 0 ? data.rating.toFixed(1) : "—";
  const reviews = data?.reviews ?? [];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

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
          Ratings &amp; reviews
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16a34a"
              colors={["#16a34a"]}
            />
          }
        >
          {/* Summary */}
          <View
            className="flex-row items-center bg-card rounded-2xl p-5"
            style={CARD_SURFACE}
          >
            <View className="items-center" style={{ marginRight: 20 }}>
              <Text className="text-foreground font-bold" style={{ fontSize: 40, lineHeight: 44 }}>
                {avg}
              </Text>
              <Stars rating={Math.round(data?.rating ?? 0)} />
            </View>
            <View className="flex-1" style={{ minWidth: 0 }}>
              <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
                {data?.totalReviews ?? 0}{" "}
                {data && data.totalReviews === 1 ? "review" : "reviews"}
              </Text>
              <Text className="text-muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 19 }}>
                Families rate your care after each cycle. Your average feeds the
                matching that assigns you to new families.
              </Text>
            </View>
          </View>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <View className="items-center" style={{ marginTop: 48 }}>
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "#fffbeb" }}
              >
                <Ionicons name="star-outline" size={28} color="#b45309" />
              </View>
              <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
                No reviews yet
              </Text>
              <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                Once families you care for complete a cycle and rate you, their
                reviews appear here.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 12 }}>
                ALL REVIEWS
              </Text>
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
