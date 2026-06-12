import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { VisitRequest } from "@/constants/caregiver-dashboard";

type Props = {
  request: VisitRequest;
  onPress: (request: VisitRequest) => void;
  onDecline: (request: VisitRequest) => void;
};

function DetailItem({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-center" style={{ width: "50%", marginBottom: 10 }}>
      <Ionicons name={icon} size={15} color="#6b7280" />
      <Text className="text-foreground" style={{ fontSize: 13, marginLeft: 6 }}>
        {text}
      </Text>
    </View>
  );
}

export function VisitRequestCard({ request, onPress, onDecline }: Props) {
  return (
    <Pressable
      onPress={() => onPress(request)}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Family + care type */}
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: request.avatarColor }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 13 }}>
            {request.initials}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {request.familyName}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {request.careType}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: "#dcfce7" }}
        >
          <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "600" }}>
            New
          </Text>
        </View>
      </View>

      {/* Payout banner */}
      <View
        className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
        style={{ backgroundColor: "#f0fdf4" }}
      >
        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
        <Text
          style={{ color: "#15803d", fontSize: 13, fontWeight: "600", marginLeft: 6 }}
        >
          You&apos;ll earn GH₵ {request.payoutGhs.toFixed(2)} for this visit
        </Text>
      </View>

      {/* Visit details grid */}
      <View className="flex-row flex-wrap mt-4">
        <DetailItem icon="calendar-outline" text={request.date} />
        <DetailItem
          icon="time-outline"
          text={`${request.time} · ${request.durationHrs}hrs`}
        />
        <DetailItem icon="location-outline" text={request.location} />
        <DetailItem icon="walk-outline" text={`${request.distanceKm} km away`} />
      </View>

      {/* Actions */}
      <View className="flex-row mt-1" style={{ gap: 10 }}>
        <Pressable
          onPress={() => onDecline(request)}
          className="rounded-full items-center justify-center px-5 py-3"
          style={{ borderWidth: 1, borderColor: "#e5e7eb" }}
        >
          <Text className="text-muted font-semibold" style={{ fontSize: 14 }}>
            Decline
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/visit-request/${request.id}` as any)}
          className="flex-1 rounded-full items-center justify-center py-3"
          style={{ backgroundColor: "#16a34a" }}
        >
          <Text className="text-white font-semibold" style={{ fontSize: 14 }}>
            View visit
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
