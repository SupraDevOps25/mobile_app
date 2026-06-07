import { Text, View } from "react-native";
import type { CaregiverDetail } from "@/constants/mock-data";

type Props = { caregiver: CaregiverDetail };

type StatItem = { value: string; label: string };

function Stat({ value, label }: StatItem) {
  return (
    <View className="flex-1 items-center py-4">
      <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text className="text-muted text-center" style={{ fontSize: 12, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      className="self-stretch my-3"
      style={{ width: 1, backgroundColor: "#e5e7eb" }}
    />
  );
}

export function StatBar({ caregiver }: Props) {
  return (
    <View
      className="flex-row mx-5 rounded-2xl overflow-hidden mb-5"
      style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <Stat value={`${caregiver.visitsDone}`} label="Visits done" />
      <Divider />
      <Stat value={`${caregiver.yearsExp} yrs`} label="Experience" />
      <Divider />
      <Stat value={`~${caregiver.responseTimeMin} min`} label="Response time" />
    </View>
  );
}
