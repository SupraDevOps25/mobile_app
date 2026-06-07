import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { CaregiverDetail } from "@/constants/mock-data";

type Props = {
  caregiver: CaregiverDetail;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  address: string;
  service: string;
};

function IconRow({
  iconName,
  value,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View
      className="flex-row items-center gap-3 py-3"
      style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <Ionicons name={iconName} size={16} color="#374151" />
      </View>
      <Text className="text-foreground flex-1" style={{ fontSize: 14 }}>
        {value}
      </Text>
    </View>
  );
}

export function VisitSummaryCard({
  caregiver,
  dateLabel,
  timeLabel,
  durationLabel,
  address,
  service,
}: Props) {
  return (
    <View
      className="mx-5 rounded-2xl px-5 pt-4 pb-2"
      style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <Text
        className="text-foreground font-semibold mb-3"
        style={{ fontSize: 13, letterSpacing: 0.5 }}
      >
        VISIT DETAILS
      </Text>

      {/* Caregiver row */}
      <View className="flex-row items-center gap-3 pb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: caregiver.avatarColor }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 13 }}>
            {caregiver.initials}
          </Text>
        </View>
        <View>
          <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
            {caregiver.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12 }}>
            {caregiver.role}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12 }}>
            {caregiver.rating} · Verified caregiver
          </Text>
        </View>
      </View>

      <IconRow iconName="calendar-outline" value={dateLabel} />
      <IconRow iconName="time-outline" value={`${timeLabel} · ${durationLabel}`} />
      <IconRow iconName="location-outline" value={address} />
      <IconRow iconName="medical-outline" value={service} />
    </View>
  );
}
