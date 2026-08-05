import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { NurseReviewForm } from "@/components/care-plan/NurseReviewForm";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ApiReviewStatus } from "@/services/review.service";

// Bottom sheet holding the family's rating form for each nurse still awaiting a
// review on a subscription. As each nurse is rated they drop off the list; once
// the last one is done it shows a short thank-you.
export function ReviewSheet({
  visible,
  onClose,
  status,
}: {
  visible: boolean;
  onClose: () => void;
  status: ApiReviewStatus;
}) {
  const caregivers = status.caregivers;
  const multiple = caregivers.length > 1;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={multiple ? "Rate your care team" : "Rate your nurse"}
    >
      {caregivers.length === 0 ? (
        <View className="items-center" style={{ paddingVertical: 24 }}>
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: "#dcfce7" }}
          >
            <Ionicons name="checkmark" size={28} color="#16a34a" />
          </View>
          <Text className="text-foreground font-bold" style={{ fontSize: 16, marginTop: 12 }}>
            Thank you!
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            Your review helps us match great nurses to families.
          </Text>
          <Pressable
            onPress={onClose}
            className="rounded-2xl items-center justify-center mt-5"
            style={{ backgroundColor: "#1e3a8a", paddingVertical: 13, paddingHorizontal: 40 }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              Done
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text className="text-muted" style={{ fontSize: 13, lineHeight: 19, marginBottom: 4 }}>
            All care visits for this plan are complete. Rate{" "}
            {multiple ? "the nurses who" : "the nurse who"} cared for your loved
            one — it takes a moment and improves future matches.
          </Text>
          {caregivers.map((cg) => (
            <NurseReviewForm
              key={cg.caregiverId}
              subscriptionId={status.subscriptionId}
              packageName={status.packageName}
              caregiver={cg}
            />
          ))}
        </>
      )}
    </BottomSheet>
  );
}
