import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import { useSubmitReview } from "@/hooks/useReviews";
import type { ApiReviewNurse } from "@/services/review.service";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

// Mandatory end-of-cycle prompt: the family rates a nurse (lead or assistant)
// who delivered care before they can renew. Feeds the caregiver's average, used
// in matching.
export function NurseReviewCard({
  subscriptionId,
  packageName,
  caregiver,
}: {
  subscriptionId: string;
  packageName: string | null;
  caregiver: ApiReviewNurse;
}) {
  const submit = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  function onSubmit() {
    if (rating < 1) {
      Alert.alert("Add a rating", "Please tap a star to rate your nurse.");
      return;
    }
    submit.mutate(
      {
        subscriptionId,
        caregiverId: caregiver.caregiverId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () =>
          Alert.alert(
            "Thank you",
            "Your review helps us keep matching great nurses to families.",
          ),
        onError: (err: Error) =>
          Alert.alert("Couldn't submit review", err.message),
      },
    );
  }

  return (
    <View
      className="rounded-2xl p-5 mt-4"
      style={{ backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" }}
    >
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Ionicons name="star" size={18} color="#b45309" />
        <Text className="font-bold" style={{ color: "#92400e", fontSize: 15, flex: 1 }}>
          Rate {ASSIGNMENT_ROLE_LABELS[caregiver.role].toLowerCase()}
        </Text>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#fef3c7" }}>
          <Text style={{ color: "#92400e", fontSize: 10, fontWeight: "700" }}>
            REQUIRED
          </Text>
        </View>
      </View>
      <Text style={{ color: "#92400e", fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>
        This care cycle is complete. Please rate the nurse before renewing — it
        helps us match the right care in future.
      </Text>

      {/* Nurse */}
      <View
        className="flex-row items-center rounded-2xl p-3 mt-4"
        style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#fde68a" }}
      >
        <Avatar
          name={caregiver.name}
          initials={caregiver.initials}
          photoUrl={caregiver.photoUrl}
          size={44}
        />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {caregiver.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {ASSIGNMENT_ROLE_LABELS[caregiver.role]} · {packageName ?? "Care package"}
          </Text>
        </View>
      </View>

      {/* Stars */}
      <View className="items-center mt-4">
        <View className="flex-row" style={{ gap: 10 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={34}
                color={n <= rating ? "#f59e0b" : "#d1a15a"}
              />
            </Pressable>
          ))}
        </View>
        <Text style={{ color: "#92400e", fontSize: 12.5, fontWeight: "600", marginTop: 8, minHeight: 18 }}>
          {rating > 0 ? RATING_LABELS[rating] : "Tap to rate"}
        </Text>
      </View>

      {/* Comment */}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Share a few words about your experience (optional)"
        placeholderTextColor="#b8965a"
        multiline
        maxFontSizeMultiplier={1.2}
        style={{
          minHeight: 72,
          borderWidth: 1,
          borderColor: "#fde68a",
          backgroundColor: "#ffffff",
          borderRadius: 14,
          padding: 12,
          fontSize: 14,
          color: "#111827",
          textAlignVertical: "top",
          marginTop: 14,
        }}
      />

      <Pressable
        onPress={onSubmit}
        disabled={submit.isPending}
        className="rounded-2xl items-center justify-center mt-3 flex-row"
        style={{ backgroundColor: submit.isPending ? "#d1a15a" : "#b45309", paddingVertical: 14, gap: 8 }}
      >
        {submit.isPending && <ActivityIndicator color="#ffffff" size="small" />}
        <Text className="text-white font-bold" style={{ fontSize: 15 }}>
          Submit review
        </Text>
      </Pressable>
    </View>
  );
}
