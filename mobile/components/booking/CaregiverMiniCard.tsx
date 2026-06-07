import { Pressable, Text, View } from "react-native";
import type { CaregiverDetail } from "@/constants/mock-data";

type Props = {
  caregiver: CaregiverDetail;
  onChangeCaregiver?: () => void;
};

export function CaregiverMiniCard({ caregiver, onChangeCaregiver }: Props) {
  return (
    <View
      className="flex-row items-center px-5 py-4 mx-5 rounded-2xl"
      style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Avatar */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: caregiver.avatarColor }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 14 }}>
          {caregiver.initials}
        </Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
          {caregiver.name}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {caregiver.rating} · {caregiver.role}
        </Text>
        <Text style={{ fontSize: 12, color: "#374151", marginTop: 1, fontWeight: "600" }}>
          GHC {caregiver.hourlyRate}/hr
        </Text>
      </View>

      {/* Change link */}
      {onChangeCaregiver && (
        <Pressable onPress={onChangeCaregiver} hitSlop={8}>
          <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
            Change
          </Text>
        </Pressable>
      )}
    </View>
  );
}
