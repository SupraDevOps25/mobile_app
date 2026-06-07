import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { Caregiver } from "@/constants/mock-data";

type Props = {
  caregiver: Caregiver;
};

export function CaregiverCard({ caregiver }: Props) {
  const router = useRouter();
  const isToday = caregiver.availability === "today";

  return (
    <View
      className="flex-row items-center py-3.5"
      style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
    >
      {/* Avatar */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: caregiver.avatarColor }}
      >
        <Text
          className="text-white font-bold"
          style={{ fontSize: 14 }}
        >
          {caregiver.initials}
        </Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
          {caregiver.name}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {caregiver.role} · {caregiver.yearsExp} yrs exp
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="star" size={11} color="#f59e0b" />
          <Text className="text-foreground font-medium" style={{ fontSize: 12 }}>
            {caregiver.rating}
          </Text>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isToday ? "#dcfce7" : "#f3f4f6" }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: isToday ? "#16a34a" : "#6b7280",
              }}
            >
              {isToday ? "Available Today" : "Tomorrow"}
            </Text>
          </View>
        </View>
      </View>

      {/* Book button */}
      <Pressable
        onPress={() => router.push(`/caregiver/${caregiver.id}` as any)}
        className="rounded-xl px-4 py-2"
        style={{ backgroundColor: "#1e3a8a" }}
      >
        <Text
          className="text-white font-semibold"
          style={{ fontSize: 13 }}
        >
          Book
        </Text>
      </Pressable>
    </View>
  );
}
