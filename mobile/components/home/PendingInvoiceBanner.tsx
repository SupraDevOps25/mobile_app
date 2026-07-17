import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useInvoices } from "@/hooks/useBilling";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// Surfaces on the family dashboard the moment the coordinator issues an invoice
// (an unpaid PENDING payment). Taps through to the invoices screen to pay. Hidden
// when there's nothing outstanding.
export function PendingInvoiceBanner() {
  const router = useRouter();
  const { data: invoices } = useInvoices();

  const pending = (invoices ?? []).find((i) => i.status === "PENDING");
  // Collapses entirely (no empty gap) when nothing is outstanding.
  if (!pending) return null;

  return (
    <View className="px-5 mb-5">
      <Pressable
        onPress={() => router.push("/invoices" as any)}
        className="flex-row items-center rounded-2xl p-4"
        style={{ backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa" }}
      >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: "#ffedd5" }}
      >
        <Ionicons name="receipt-outline" size={19} color="#c2410c" />
      </View>
      <View className="flex-1 ml-3">
        <Text style={{ color: "#9a3412", fontSize: 14, fontWeight: "700" }}>
          Invoice ready to pay
        </Text>
        <Text style={{ color: "#c2410c", fontSize: 12, marginTop: 1 }}>
          GHS {pending.amount.toLocaleString()} ·{" "}
          {fmtDate(pending.billingPeriodStart)} – {fmtDate(pending.billingPeriodEnd)}
        </Text>
      </View>
      <View
        className="rounded-full px-3 py-1.5"
        style={{ backgroundColor: "#ea580c" }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 12 }}>
          Pay now
        </Text>
      </View>
      </Pressable>
    </View>
  );
}
