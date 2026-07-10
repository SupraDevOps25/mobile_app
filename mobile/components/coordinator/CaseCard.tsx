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
import { Avatar } from "@/components/ui/Avatar";
import { initialsOf } from "@/lib/avatar";
import type { ApiCoordinatorCase } from "@/services/coordinator.service";

type Props = {
  item: ApiCoordinatorCase;
  onPress: (item: ApiCoordinatorCase) => void;
};

export function CaseCard({ item, onPress }: Props) {
  const pill = subscriptionStatusPill(item.status);
  const action = caseAction(item.status);
  const needsAttention = action !== "NONE";

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: needsAttention ? "#99f6e4" : "#eef0f3",
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        // Subtle lift so the card reads as a tappable surface.
        shadowColor: "#0f172a",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      })}
    >
      {/* Top row */}
      <View className="flex-row items-center">
        <Avatar
          name={item.recipient.name}
          initials={initialsOf(item.recipient.name)}
          photoUrl={item.family.photoUrl}
          size={46}
        />
        <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
          <Text className="text-foreground font-bold" style={{ fontSize: 15.5 }}>
            {item.recipient.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {item.recipient.age} yrs · {item.recipient.area}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: pill.bg, flexShrink: 0 }}
        >
          <Text style={{ color: pill.color, fontSize: 10, fontWeight: "700" }}>
            {SUBSCRIPTION_STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 }} />

      {/* Bottom row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1" style={{ paddingRight: 8, minWidth: 0 }}>
          <Ionicons name="briefcase-outline" size={13} color="#6b7280" />
          <Text
            className="text-muted"
            style={{ fontSize: 12, marginLeft: 5, flex: 1 }}
            numberOfLines={1}
          >
            {PACKAGE_LABELS[item.packageType]} · {item.family.name}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8, flexShrink: 0 }}>
          {needsAttention && (
            <View
              className="flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: "#ccfbf1" }}
            >
              <Ionicons name="alert-circle" size={12} color="#0f766e" />
              <Text style={{ color: "#0f766e", fontSize: 10, fontWeight: "700", marginLeft: 4 }}>
                {CASE_ACTION_LABELS[action]}
              </Text>
            </View>
          )}
          <View
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <Ionicons name="chevron-forward" size={15} color="#0d9488" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
