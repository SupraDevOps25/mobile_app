import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Text, View } from "react-native";

type Props = {
  greeting: string;
  firstName: string;
  initials: string;
  dateLabel: string;
  offerCount: number;
  photoUrl?: string | null;
};

export function GreetingCard({
  greeting,
  firstName,
  initials,
  dateLabel,
  offerCount,
  photoUrl,
}: Props) {
  return (
    <View
      className="rounded-3xl"
      style={{
        backgroundColor: "#0f2461",
        paddingHorizontal: 20,
        paddingVertical: 22,
        minHeight: 150,
        overflow: "hidden",
      }}
    >
      {/* Off-white decorative pattern — soft overlapping circles */}
      <View
        style={{
          position: "absolute",
          top: -46,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 6,
          right: 40,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -44,
          left: -18,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-white font-bold" style={{ fontSize: 21 }}>
            {greeting}, {firstName}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            {dateLabel}
          </Text>
        </View>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#16a34a",
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Encouraging line — fits the caregiving context */}
      <View
        className="flex-row items-center"
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.12)",
        }}
      >
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 28, height: 28, backgroundColor: "rgba(74,222,128,0.18)" }}
        >
          <Ionicons name="heart" size={15} color="#4ade80" />
        </View>
        <Text style={{ color: "#cbd5e1", fontSize: 12.5, marginLeft: 10, flex: 1 }}>
          Every visit makes a difference. Have a great shift.
        </Text>
      </View>

      {offerCount > 0 && (
        <View
          className="flex-row items-center self-start rounded-full px-3 py-1.5 mt-3"
          style={{ backgroundColor: "rgba(22, 163, 74, 0.25)" }}
        >
          <View
            className="rounded-full mr-2"
            style={{ width: 6, height: 6, backgroundColor: "#4ade80" }}
          />
          <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "600" }}>
            {offerCount} new assignment offer{offerCount > 1 ? "s" : ""}
          </Text>
        </View>
      )}
    </View>
  );
}
