import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { PACKAGE_LABELS } from "@/constants/package-presentation";
import {
  CASE_ACTION_LABELS,
  caseAction,
} from "@/constants/coordinator-presentation";
import {
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusPill,
} from "@/constants/subscription-presentation";
import { avatarColor, initialsOf } from "@/lib/avatar";
import type { ApiCoordinatorCase } from "@/services/coordinator.service";

type Props = {
  item: ApiCoordinatorCase;
  onPress: (item: ApiCoordinatorCase) => void;
};

export function CaseCard({ item, onPress }: Props) {
  const pill = subscriptionStatusPill(item.status);
  const action = caseAction(item.status);

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor(item.recipient.name) }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 14 }}>
            {initialsOf(item.recipient.name)}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {item.recipient.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {item.recipient.age} yrs · {item.recipient.area}
          </Text>
        </View>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: pill.bg }}>
          <Text style={{ color: pill.color, fontSize: 10, fontWeight: "600" }}>
            {SUBSCRIPTION_STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Ionicons name="briefcase-outline" size={13} color="#6b7280" />
          <Text className="text-muted" style={{ fontSize: 12, marginLeft: 5 }}>
            {PACKAGE_LABELS[item.packageType]} · {item.family.name}
          </Text>
        </View>
        {action !== "NONE" && (
          <View
            className="flex-row items-center rounded-full px-2.5 py-1"
            style={{ backgroundColor: "#ccfbf1" }}
          >
            <Ionicons name="alert-circle" size={12} color="#0f766e" />
            <Text style={{ color: "#0f766e", fontSize: 10, fontWeight: "600", marginLeft: 4 }}>
              {CASE_ACTION_LABELS[action]}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
