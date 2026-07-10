import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { PackageView } from "@/constants/package-presentation";

// Compact package row reused on the checkout and confirmation screens.
export function PackageSummaryCard({ pkg }: { pkg: PackageView }) {
  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center"
        style={{ backgroundColor: pkg.accentBg }}
      >
        <Ionicons name={pkg.icon} size={20} color={pkg.accent} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
          {pkg.name}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
          {pkg.tagline}
        </Text>
      </View>
      <View className="items-end" style={{ flexShrink: 0 }}>
        <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
          GHS {pkg.priceGhs.toLocaleString()}
        </Text>
        <Text className="text-muted" style={{ fontSize: 11 }}>
          per month
        </Text>
      </View>
    </View>
  );
}
