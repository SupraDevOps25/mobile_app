import { Text, View } from "react-native";

type Props = {
  greeting: string;
  firstName: string;
  initials: string;
  dateLabel: string;
  newRequestCount: number;
};

export function GreetingCard({
  greeting,
  firstName,
  initials,
  dateLabel,
  newRequestCount,
}: Props) {
  return (
    <View
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#0f2461" }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-white font-bold" style={{ fontSize: 20 }}>
            {greeting}, {firstName}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            {dateLabel}
          </Text>
        </View>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "#16a34a" }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 14 }}>
            {initials}
          </Text>
        </View>
      </View>

      {newRequestCount > 0 && (
        <View
          className="flex-row items-center self-start rounded-full px-3 py-1.5 mt-4"
          style={{ backgroundColor: "rgba(22, 163, 74, 0.25)" }}
        >
          <View
            className="rounded-full mr-2"
            style={{ width: 6, height: 6, backgroundColor: "#4ade80" }}
          />
          <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "600" }}>
            {newRequestCount} new visit request{newRequestCount > 1 ? "s" : ""}
          </Text>
        </View>
      )}
    </View>
  );
}
