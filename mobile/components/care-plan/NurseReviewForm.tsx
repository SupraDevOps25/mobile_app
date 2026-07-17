import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import { useSubmitReview } from "@/hooks/useReviews";
import type { ApiReviewNurse } from "@/services/review.service";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

// One nurse's rating form (stars + optional comment). Presentational body used
// inside the review bottom sheet — the sheet owns the surface, this owns the
// input. Feeds the caregiver's average, which the matching process relies on.
export function NurseReviewForm({
  subscriptionId,
  packageName,
  caregiver,
  onSubmitted,
}: {
  subscriptionId: string;
  packageName: string | null;
  caregiver: ApiReviewNurse;
  onSubmitted?: () => void;
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
        onSuccess: () => onSubmitted?.(),
        onError: (err: Error) =>
          Alert.alert("Couldn't submit review", err.message),
      },
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {/* Nurse */}
      <View
        className="flex-row items-center rounded-2xl p-3"
        style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#eef2f6" }}
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
                color={n <= rating ? "#f59e0b" : "#d1d5db"}
              />
            </Pressable>
          ))}
        </View>
        <Text style={{ color: rating > 0 ? "#b45309" : "#9ca3af", fontSize: 12.5, fontWeight: "600", marginTop: 8, minHeight: 18 }}>
          {rating > 0 ? RATING_LABELS[rating] : "Tap to rate"}
        </Text>
      </View>

      {/* Comment */}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Share a few words about your experience (optional)"
        placeholderTextColor="#9ca3af"
        multiline
        maxFontSizeMultiplier={1.2}
        style={{
          minHeight: 72,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#f9fafb",
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
        style={{ backgroundColor: submit.isPending ? "#93c5a3" : "#1e3a8a", paddingVertical: 14, gap: 8 }}
      >
        {submit.isPending && <ActivityIndicator color="#ffffff" size="small" />}
        <Text className="text-white font-bold" style={{ fontSize: 15 }}>
          Submit review
        </Text>
      </Pressable>
    </View>
  );
}
