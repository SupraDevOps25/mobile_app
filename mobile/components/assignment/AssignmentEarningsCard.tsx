import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { ApiAssignment } from "@/services/assignment.service";

export function AssignmentEarningsCard({
  assignment,
}: {
  assignment: ApiAssignment;
}) {
  return (
    <View
      className="flex-row items-center rounded-2xl p-4"
      style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#dcfce7" }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: "#dcfce7" }}
      >
        <Ionicons name="cash-outline" size={18} color="#16a34a" />
      </View>
      <View className="flex-1 ml-3">
        <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
          You&apos;ll earn
        </Text>
        <View className="flex-row items-baseline">
          <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
            {assignment.payoutGhs != null
              ? `GHS ${assignment.payoutGhs.toLocaleString()}`
              : "To be confirmed"}
          </Text>
          {assignment.payoutGhs != null && (
            <Text className="text-muted" style={{ fontSize: 13, marginLeft: 4 }}>
              /month
            </Text>
          )}
        </View>
      </View>
      <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
        Paid monthly
      </Text>
    </View>
  );
}
