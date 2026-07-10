import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import type { PackageView } from "@/constants/package-presentation";

type Props = {
  pkg: PackageView;
  onPress: (pkg: PackageView) => void;
};

export function PackageCard({ pkg, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(pkg)}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#eef0f3",
        marginBottom: 12,
        opacity: pressed ? 0.9 : 1,
        padding: 16,
        shadowColor: "#0f172a",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: pkg.accentBg }}
        >
          <Ionicons name={pkg.icon} size={22} color={pkg.accent} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
            {pkg.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
            {pkg.tagline}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </View>

      <View className="mt-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 20, lineHeight: 26 }}>
          GHS {pkg.priceGhs.toLocaleString()}
          <Text className="text-muted" style={{ fontSize: 13, fontWeight: "400" }}>
            {" "}
            /month
          </Text>
        </Text>
      </View>

      <Text className="text-muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 18 }}>
        {pkg.idealFor}
      </Text>
    </Pressable>
  );
}
