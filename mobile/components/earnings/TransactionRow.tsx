import { Text, View } from "react-native";
import type { Transaction } from "@/constants/earnings";

const STATUS_STYLES = {
  paid: { bg: "#dcfce7", color: "#16a34a", label: "Paid" },
  pending: { bg: "#fef9c3", color: "#a16207", label: "Pending" },
} as const;

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const status = STATUS_STYLES[transaction.status];

  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Date badge */}
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 48, height: 48, backgroundColor: "#eef2ff" }}
      >
        <Text style={{ color: "#1e3a8a", fontSize: 16, fontWeight: "700" }}>
          {transaction.dayOfMonth}
        </Text>
        <Text style={{ color: "#1e3a8a", fontSize: 9, fontWeight: "600" }}>
          {transaction.month}
        </Text>
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
          {transaction.patientName}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {transaction.service} · {transaction.durationHrs}hrs
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-foreground font-bold" style={{ fontSize: 14 }}>
          GH₵ {transaction.amountGhs}
        </Text>
        <View
          className="rounded-full px-2 py-0.5 mt-1"
          style={{ backgroundColor: status.bg }}
        >
          <Text style={{ color: status.color, fontSize: 10, fontWeight: "600" }}>
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
}
