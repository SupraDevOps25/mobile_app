import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { NextStepsCard } from "@/components/packages/NextStepsCard";

// Shown while the subscription status is "matching" — the system and Care
// Coordinator are still assembling the care team, so there's nobody to show yet.
export function MatchingView() {
  return (
    <View>
      <View className="items-center" style={{ marginTop: 28, marginBottom: 8 }}>
        <View
          className="w-20 h-20 rounded-full items-center justify-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="people-outline" size={36} color="#2563eb" />
        </View>
        <Text
          className="text-foreground font-bold text-center"
          style={{ fontSize: 18, marginTop: 16 }}
        >
          Matching your care team
        </Text>
        <Text
          className="text-muted text-center"
          style={{ fontSize: 14, marginTop: 6, lineHeight: 20, paddingHorizontal: 12 }}
        >
          We&apos;re selecting the most suitable nurse and backups for your loved one.
          Your Care Coordinator will confirm the team shortly.
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <NextStepsCard />
      </View>
    </View>
  );
}
