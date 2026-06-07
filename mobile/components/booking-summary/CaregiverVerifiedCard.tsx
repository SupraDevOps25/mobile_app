import { Text, View } from "react-native";
import type { CaregiverDetail } from "@/constants/mock-data";

type Props = { caregiver: CaregiverDetail };

export function CaregiverVerifiedCard({ caregiver }: Props) {
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
          {caregiver.role} · {caregiver.yearsExp} yrs experience
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {caregiver.rating} · {caregiver.reviewCount} reviews
        </Text>
      </View>

      {/* Verified badge */}
      <View
        className="px-2.5 py-1 rounded-full"
        style={{ backgroundColor: "#dcfce7" }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#16a34a" }}>
          Verified
        </Text>
      </View>
    </View>
  );
}
