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
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
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

      <View className="flex-row items-baseline mt-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
          GHS {pkg.priceGhs.toLocaleString()}
        </Text>
        <Text className="text-muted" style={{ fontSize: 13, marginLeft: 3 }}>
          /month
        </Text>
      </View>

      <Text className="text-muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 18 }}>
        {pkg.idealFor}
      </Text>
    </Pressable>
  );
}
