import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

export type QuickLogItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const QUICK_LOG_ITEMS: QuickLogItem[] = [
  { id: "medication", label: "Medication given", icon: "medkit-outline" },
  { id: "vitals", label: "Vitals checked", icon: "pulse-outline" },
  { id: "resting", label: "Patient resting", icon: "bed-outline" },
  { id: "family", label: "Family updated", icon: "people-outline" },
];

type Props = {
  logged: string[]; // ids of completed items
  onToggle: (id: string) => void;
};

export function QuickLogGrid({ logged, onToggle }: Props) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {QUICK_LOG_ITEMS.map((item) => {
        const active = logged.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            className="flex-row items-center rounded-xl px-3 py-3"
            style={{
              width: "48%",
              borderWidth: 1,
              borderColor: active ? "#16a34a" : "#e5e7eb",
              backgroundColor: active ? "#f0fdf4" : "#ffffff",
            }}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={active ? "#16a34a" : "#6b7280"}
            />
            <Text
              className="font-semibold"
              style={{
                fontSize: 12,
                marginLeft: 6,
                color: active ? "#15803d" : "#374151",
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
