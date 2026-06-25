import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { CARE_TEAM_ROLE_LABELS, type CareTeamMember, type TeamNurse } from "@/constants/care";

type Props = {
  member: CareTeamMember;
  onPress: (nurse: TeamNurse) => void;
};

export function TeamNurseRow({ member, onPress }: Props) {
  const { nurse, role } = member;
  const isAssigned = role === "assigned";

  return (
    <Pressable
      onPress={() => onPress(nurse)}
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{
        borderWidth: 1,
        borderColor: isAssigned ? "#bbf7d0" : "#f3f4f6",
      }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{ backgroundColor: nurse.avatarColor }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 14 }}>
          {nurse.initials}
        </Text>
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {nurse.name}
          </Text>
          {nurse.licenseVerified && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#2563eb"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {nurse.qualification} · {nurse.yearsExperience} yrs · ★ {nurse.rating}
        </Text>
      </View>

      <View
        className="rounded-full px-2.5 py-1 mr-1"
        style={{ backgroundColor: isAssigned ? "#dcfce7" : "#f3f4f6" }}
      >
        <Text
          style={{
            color: isAssigned ? "#16a34a" : "#6b7280",
            fontSize: 10,
            fontWeight: "600",
          }}
        >
          {CARE_TEAM_ROLE_LABELS[role]}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </Pressable>
  );
}
