import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import { avatarColor } from "@/lib/avatar";
import type { ApiTeamNurse } from "@/services/subscription.service";

type Props = {
  nurse: ApiTeamNurse;
  onPress: (nurse: ApiTeamNurse) => void;
};

export function TeamNurseRow({ nurse, onPress }: Props) {
  const isLead = nurse.role === "PRIMARY";

  return (
    <Pressable
      onPress={() => onPress(nurse)}
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{
        borderWidth: 1,
        borderColor: isLead ? "#bbf7d0" : "#f3f4f6",
      }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{ backgroundColor: avatarColor(nurse.name) }}
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
          <Ionicons
            name="checkmark-circle"
            size={14}
            color="#2563eb"
            style={{ marginLeft: 4 }}
          />
        </View>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {nurse.qualification ?? "Nurse"} · {nurse.yearsExperience} yrs · ★{" "}
          {nurse.rating.toFixed(1)}
        </Text>
      </View>

      <View
        className="rounded-full px-2.5 py-1 mr-1"
        style={{ backgroundColor: isLead ? "#dcfce7" : "#f3f4f6" }}
      >
        <Text
          style={{
            color: isLead ? "#16a34a" : "#6b7280",
            fontSize: 10,
            fontWeight: "600",
          }}
        >
          {ASSIGNMENT_ROLE_LABELS[nurse.role]}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </Pressable>
  );
}
