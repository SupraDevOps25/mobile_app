import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePayInvoice, useInvoices, useVerifyPayment } from "@/hooks/useBilling";
import type { ApiInvoice, ApiPaymentStatus } from "@/services/billing.service";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function periodLabel(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

const STATUS_PILL: Record<
  ApiPaymentStatus,
  { bg: string; color: string; label: string }
> = {
  PENDING: { bg: "#fffbeb", color: "#b45309", label: "Due" },
  SUCCESS: { bg: "#f0fdf4", color: "#16a34a", label: "Paid" },
  FAILED: { bg: "#fef2f2", color: "#dc2626", label: "Failed" },
  ABANDONED: { bg: "#f3f4f6", color: "#6b7280", label: "Abandoned" },
};

export default function InvoicesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: invoices, isLoading } = useInvoices();
  const payInvoice = usePayInvoice();
  const verifyPayment = useVerifyPayment();
  const [payingId, setPayingId] = useState<string | null>(null);

  async function handlePay(invoice: ApiInvoice) {
    setPayingId(invoice.id);
    try {
      const init = await payInvoice.mutateAsync(invoice.id);
      await WebBrowser.openBrowserAsync(init.authorizationUrl);
      // Paystack doesn't notify us directly — verify when the nurse returns.
      const result = await verifyPayment.mutateAsync(init.reference);
      if (result.status === "SUCCESS") {
        Alert.alert("Payment received", "Thank you — your invoice has been paid.");
      } else {
        Alert.alert(
          "Payment not confirmed",
          "We couldn't confirm your payment yet. If you completed it, it may take a moment to reflect.",
        );
      }
    } catch (err) {
      Alert.alert("Payment failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Invoices
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : (invoices ?? []).length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="receipt-outline" size={28} color="#2563eb" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            No invoices yet
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            Supracarer invoices at the end of each care month. Your invoices will
            appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          {(invoices ?? []).map((invoice) => {
            const pill = STATUS_PILL[invoice.status];
            const payable = invoice.status !== "SUCCESS";
            const busy = payingId === invoice.id;
            return (
              <View
                key={invoice.id}
                className="bg-card rounded-2xl p-4 mb-3"
                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-muted" style={{ fontSize: 12 }}>
                      Care period
                    </Text>
                    <Text className="text-foreground font-semibold" style={{ fontSize: 14, marginTop: 2 }}>
                      {periodLabel(invoice.billingPeriodStart, invoice.billingPeriodEnd)}
                    </Text>
                  </View>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: pill.bg }}>
                    <Text style={{ color: pill.color, fontSize: 11, fontWeight: "600" }}>
                      {pill.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-baseline mt-3">
                  <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
                    {invoice.currency} {invoice.amount.toLocaleString()}
                  </Text>
                </View>

                {invoice.paidAt && (
                  <Text className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Paid {new Date(invoice.paidAt).toLocaleDateString()}
                  </Text>
                )}

                {payable && (
                  <Pressable
                    onPress={() => handlePay(invoice)}
                    disabled={busy}
                    className="rounded-xl items-center justify-center mt-4 flex-row"
                    style={{ backgroundColor: busy ? "#9ca3af" : "#1e3a8a", paddingVertical: 13, gap: 8 }}
                  >
                    {busy && <ActivityIndicator color="#ffffff" size="small" />}
                    <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                      {busy ? "Processing…" : "Pay now"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}

          <View
            className="flex-row rounded-2xl p-4 mt-2"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#2563eb" />
            <Text
              style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
            >
              Payments are processed securely by Paystack.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
