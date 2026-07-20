import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CARD_SURFACE } from "@/components/ui/AppCard";
import { useAuth } from "@/hooks/useAuth";
import { usePayInvoice, useInvoices, useVerifyPayment } from "@/hooks/useBilling";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
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

export default function InvoicesTab() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: invoices, isLoading, refetch, isRefetching } = useInvoices();
  const payInvoice = usePayInvoice();
  const verifyPayment = useVerifyPayment();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const familyName = user?.firstName || undefined;

  // Poll verify a few times — a fresh charge can take a moment to settle.
  const confirmPayment = useCallback(
    async (reference: string): Promise<ApiPaymentStatus> => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await verifyPayment.mutateAsync(reference);
        if (res.status !== "PENDING") return res.status;
        await new Promise((r) => setTimeout(r, 2000));
      }
      return "PENDING";
    },
    [verifyPayment],
  );

  async function handlePay(invoice: ApiInvoice) {
    setPayingId(invoice.id);
    try {
      // Paystack redirects here after checkout, which closes the browser and
      // brings the family straight back into the app.
      const returnUrl = Linking.createURL("billing-return");
      const init = await payInvoice.mutateAsync({
        paymentId: invoice.id,
        callbackUrl: returnUrl,
      });
      await WebBrowser.openAuthSessionAsync(init.authorizationUrl, returnUrl);
      // Confirm on the server whether we were redirected or the sheet was closed.
      const status = await confirmPayment(init.reference);
      if (status === "SUCCESS") {
        Alert.alert("Payment received", "Thank you — your invoice has been paid.");
      } else if (status === "FAILED" || status === "ABANDONED") {
        Alert.alert(
          "Payment not completed",
          "Your payment didn't go through. You can try again anytime.",
        );
      } else {
        Alert.alert(
          "Still processing",
          "We haven't confirmed your payment yet. It can take a moment — pull down to refresh, or check back shortly.",
        );
      }
    } catch (err) {
      Alert.alert("Payment failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setPayingId(null);
    }
  }

  async function handleDownload(invoice: ApiInvoice) {
    setDownloadingId(invoice.id);
    try {
      const shared = await downloadInvoicePdf(invoice, familyName);
      if (!shared) {
        Alert.alert("Not available", "Sharing isn't available on this device.");
      }
    } catch (err) {
      Alert.alert("Couldn't create PDF", err instanceof Error ? err.message : "Try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  const list = invoices ?? [];
  const current = list[0]; // backend returns newest first
  const earlier = list.slice(1);

  return (
    <View className="flex-1 bg-background">
      {/* Tab header */}
      <View className="px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Text className="text-foreground font-bold" style={{ fontSize: 24 }}>
          Invoices
        </Text>
        <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
          Your monthly care billing
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : list.length === 0 ? (
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1e3a8a" />
          }
        >
          {/* Current invoice */}
          <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>
            CURRENT INVOICE
          </Text>
          <InvoiceCard
            invoice={current}
            highlighted
            paying={payingId === current.id}
            downloading={downloadingId === current.id}
            onPay={() => handlePay(current)}
            onDownload={() => handleDownload(current)}
          />

          {/* History */}
          {earlier.length > 0 && (
            <>
              <Text className="text-muted font-semibold" style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 8 }}>
                EARLIER INVOICES
              </Text>
              {earlier.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  paying={payingId === invoice.id}
                  downloading={downloadingId === invoice.id}
                  onPay={() => handlePay(invoice)}
                  onDownload={() => handleDownload(invoice)}
                />
              ))}
            </>
          )}

          <View className="flex-row rounded-2xl p-4 mt-4" style={{ backgroundColor: "#eff6ff" }}>
            <Ionicons name="lock-closed-outline" size={16} color="#2563eb" />
            <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
              Payments are processed securely by Paystack.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function InvoiceCard({
  invoice,
  highlighted,
  paying,
  downloading,
  onPay,
  onDownload,
}: {
  invoice: ApiInvoice;
  highlighted?: boolean;
  paying: boolean;
  downloading: boolean;
  onPay: () => void;
  onDownload: () => void;
}) {
  const pill = STATUS_PILL[invoice.status];
  const payable = invoice.status !== "SUCCESS";

  return (
    <View
      className="bg-card rounded-2xl p-4 mb-3"
      style={{
        ...CARD_SURFACE,
        borderColor: highlighted && payable ? "#c7d2fe" : CARD_SURFACE.borderColor,
      }}
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

      <View className="flex-row items-center mt-4" style={{ gap: 10 }}>
        {payable && (
          <Pressable
            onPress={onPay}
            disabled={paying}
            className="flex-1 rounded-xl items-center justify-center flex-row"
            style={{ backgroundColor: paying ? "#9ca3af" : "#1e3a8a", paddingVertical: 13, gap: 8 }}
          >
            {paying && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-white font-bold" style={{ fontSize: 14 }}>
              {paying ? "Processing…" : "Pay now"}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDownload}
          disabled={downloading}
          className="rounded-xl items-center justify-center flex-row"
          style={{
            backgroundColor: "#f3f4f6",
            paddingVertical: 13,
            paddingHorizontal: 16,
            gap: 8,
            flex: payable ? 0 : 1,
          }}
        >
          {downloading ? (
            <ActivityIndicator color="#374151" size="small" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#374151" />
          )}
          <Text className="font-semibold" style={{ color: "#374151", fontSize: 14 }}>
            PDF
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
