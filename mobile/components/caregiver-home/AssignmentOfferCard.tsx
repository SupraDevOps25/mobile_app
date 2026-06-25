import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { ASSIGNMENT_ROLE_LABELS, type Assignment } from "@/constants/assignments";
import { getPackage } from "@/constants/packages";

type Props = {
  assignment: Assignment;
  onPress: (assignment: Assignment) => void;
};

export function AssignmentOfferCard({ assignment, onPress }: Props) {
  const pkg = getPackage(assignment.package);
  const isPrimary = assignment.role === "primary";
  const rolePill = isPrimary
    ? { bg: "#dcfce7", color: "#16a34a" }
    : { bg: "#eff6ff", color: "#2563eb" };

  return (
    <Pressable
      onPress={() => onPress(assignment)}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Client + role */}
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: assignment.clientAvatarColor }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 13 }}>
            {assignment.clientInitials}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {assignment.clientName}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {assignment.clientAge} yrs · {assignment.clientGender}
          </Text>
        </View>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: rolePill.bg }}>
          <Text style={{ color: rolePill.color, fontSize: 11, fontWeight: "600" }}>
            {ASSIGNMENT_ROLE_LABELS[assignment.role]}
          </Text>
        </View>
      </View>

      {/* Package + schedule */}
      <View className="flex-row items-center mt-3">
        <Ionicons name="briefcase-outline" size={14} color="#6b7280" />
        <Text className="text-foreground" style={{ fontSize: 13, marginLeft: 6 }}>
          {pkg?.name} · {assignment.schedule}
        </Text>
      </View>

      {/* Payout banner */}
      <View
        className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
        style={{ backgroundColor: "#f0fdf4" }}
      >
        <Ionicons name="cash-outline" size={16} color="#16a34a" />
        <Text style={{ color: "#15803d", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>
          Earn GHS {assignment.monthlyPayoutGhs.toLocaleString()}/month
        </Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 4 }}>
            {assignment.area} · {assignment.distanceKm} km
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
            View offer
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#16a34a" />
        </View>
      </View>
    </Pressable>
  );
}
