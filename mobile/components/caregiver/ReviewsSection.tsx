import { Alert, Pressable, Text, View } from "react-native";
import type { Review } from "@/constants/mock-data";

type Props = { reviews: Review[]; reviewCount: number };

function ReviewCard({ review }: { review: Review }) {
  return (
    <View
      className="mb-3 pb-3"
      style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: review.reviewerColor }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 11 }}>
              {review.reviewerInitials}
            </Text>
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 13 }}>
            {review.reviewerName}
          </Text>
        </View>
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {review.date}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: "#374151", lineHeight: 20 }}>
        {review.text}
      </Text>
    </View>
  );
}

export function ReviewsSection({ reviews, reviewCount }: Props) {
  return (
    <View className="mx-5 mb-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#f9fafb" }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground font-semibold" style={{ fontSize: 13, letterSpacing: 0.5 }}>
          REVIEWS
        </Text>
        <Pressable onPress={() => Alert.alert("Coming soon", "All reviews coming soon.")}>
          <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
            See all {reviewCount}
          </Text>
        </Pressable>
      </View>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </View>
  );
}
