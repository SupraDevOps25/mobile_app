import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import type { ApiAssignment } from "@/services/assignment.service";

type Props = {
  assignment: ApiAssignment;
  onPress: (assignment: ApiAssignment) => void;
};

// Minutes left to respond to an active (PRIMARY) offer, or null if queued.
function minutesLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

export function AssignmentOfferCard({ assignment, onPress }: Props) {
  const isPrimary = assignment.role === "PRIMARY";
  const rolePill = isPrimary
    ? { bg: "#dcfce7", color: "#16a34a" }
    : { bg: "#eff6ff", color: "#2563eb" };
  const mins = minutesLeft(assignment.expiresAt);
  const genderLabel = assignment.client.gender === "MALE" ? "Male" : "Female";

  return (
    <Pressable
      onPress={() => onPress(assignment)}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Client + role */}
      <View className="flex-row items-center">
        <Avatar
          name={assignment.client.name}
          initials={assignment.client.initials}
          photoUrl={assignment.family.photoUrl}
          size={40}
        />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {assignment.client.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {assignment.client.age} yrs · {genderLabel}
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
          {assignment.packageName ?? "Care package"}
          {assignment.schedule ? ` · ${assignment.schedule}` : ""}
        </Text>
      </View>

      {/* Payout banner */}
      {assignment.payoutGhs != null && (
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
          style={{ backgroundColor: "#f0fdf4" }}
        >
          <Ionicons name="cash-outline" size={16} color="#16a34a" />
          <Text style={{ color: "#15803d", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>
            Earn GHS {assignment.payoutGhs.toLocaleString()}/month
          </Text>
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 4 }}>
            {assignment.client.area}
          </Text>
        </View>
        {mins != null ? (
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#dc2626" />
            <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>
              {mins > 0 ? `${mins} min to respond` : "Expiring…"}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "600" }}>
              View offer
            </Text>
            <Ionicons name="chevron-forward" size={15} color="#16a34a" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
