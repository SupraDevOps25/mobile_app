import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { CaregiverDetail } from "@/constants/mock-data";

type Props = { caregiver: CaregiverDetail };

export function CaregiverHeroSection({ caregiver }: Props) {
  const isToday = caregiver.availability === "today";

  return (
    <View className="items-center px-6 pb-6">
      {/* Availability badge */}
      <View
        className="px-4 py-1.5 rounded-full mb-5"
        style={{ backgroundColor: isToday ? "#dcfce7" : "#f3f4f6" }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isToday ? "#16a34a" : "#6b7280",
          }}
        >
          {isToday ? "Available today" : "Available tomorrow"}
        </Text>
      </View>

      {/* Avatar */}
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: caregiver.avatarColor }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 28 }}>
          {caregiver.initials}
        </Text>
        {/* Online dot */}
        {isToday && (
          <View
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white"
            style={{ backgroundColor: "#22c55e" }}
          />
        )}
      </View>

      {/* Name & role */}
      <Text className="text-foreground font-bold text-center" style={{ fontSize: 22 }}>
        {caregiver.name}
      </Text>
      <Text className="text-muted text-center mt-1" style={{ fontSize: 14 }}>
        {caregiver.role}
      </Text>

      {/* Location */}
      <View className="flex-row items-center gap-1 mt-2">
        <Ionicons name="location-outline" size={14} color="#9ca3af" />
        <Text className="text-muted" style={{ fontSize: 13 }}>
          {caregiver.location} · {caregiver.distanceKm} km away
        </Text>
      </View>

      {/* Rating */}
      <View className="flex-row items-center gap-1.5 mt-3">
        <Ionicons name="star" size={15} color="#f59e0b" />
        <Text className="text-foreground font-semibold" style={{ fontSize: 15 }}>
          {caregiver.rating}
        </Text>
        <Text className="text-muted" style={{ fontSize: 13 }}>
          {caregiver.reviewCount} reviews
        </Text>
      </View>
    </View>
  );
}
