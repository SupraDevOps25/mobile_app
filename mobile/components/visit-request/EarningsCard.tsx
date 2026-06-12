import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { VisitDetail } from "@/constants/visit-details";

export function EarningsCard({ visit }: { visit: VisitDetail }) {
  return (
    <View
      className="flex-row items-center rounded-2xl p-4"
      style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#dcfce7" }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: "#dcfce7" }}
      >
        <Ionicons name="cash-outline" size={18} color="#16a34a" />
      </View>
      <View className="flex-1 ml-3">
        <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
          You&apos;ll earn
        </Text>
        <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
          GH₵ {visit.payoutGhs}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-muted" style={{ fontSize: 12 }}>
          GH₵ {visit.hourlyRateGhs}/hr × {visit.durationHrs}hrs
        </Text>
        <Text
          style={{ color: "#16a34a", fontSize: 12, fontWeight: "600", marginTop: 3 }}
        >
          Paid within 24hrs
        </Text>
      </View>
    </View>
  );
}
