import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "@/hooks/useFamily";
import type { ApiPaymentMethod } from "@/services/family.service";

function methodIcon(channel: string): keyof typeof Ionicons.glyphMap {
  if (channel === "mobile_money") return "phone-portrait-outline";
  if (channel === "bank") return "business-outline";
  return "card-outline";
}

function methodTitle(m: ApiPaymentMethod): string {
  const brand = m.brand
    ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1)
    : m.channel === "mobile_money"
      ? "Mobile money"
      : "Card";
  return m.last4 ? `${brand} •••• ${m.last4}` : brand;
}

function methodSubtitle(m: ApiPaymentMethod): string {
  if (m.channel === "card" && m.expMonth && m.expYear) {
    return `Expires ${m.expMonth}/${m.expYear}`;
  }
  return m.bank ?? (m.channel === "mobile_money" ? "Mobile money" : "Card");
}

function MethodCard({
  item,
  onSetDefault,
  onDelete,
  busy,
}: {
  item: ApiPaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <View
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: item.isDefault ? "#bfdbfe" : "#f3f4f6" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name={methodIcon(item.channel)} size={20} color="#2563eb" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            {methodTitle(item)}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {methodSubtitle(item)}
          </Text>
        </View>
        {item.isDefault ? (
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: "#eff6ff" }}>
            <Text style={{ color: "#2563eb", fontSize: 10, fontWeight: "700" }}>
              Default
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className="flex-row items-center mt-3 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6", gap: 18 }}
      >
        {!item.isDefault && (
          <Pressable onPress={onSetDefault} disabled={busy} hitSlop={6} className="flex-row items-center">
            <Ionicons name="star-outline" size={15} color="#2563eb" />
            <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600", marginLeft: 5 }}>
              Set as default
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onDelete} disabled={busy} hitSlop={6} className="flex-row items-center">
          <Ionicons name="trash-outline" size={15} color="#dc2626" />
          <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "600", marginLeft: 5 }}>
            Remove
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: methods, isLoading } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const remove = useDeletePaymentMethod();

  const busy = setDefault.isPending || remove.isPending;

  function confirmDelete(item: ApiPaymentMethod) {
    Alert.alert(
      "Remove payment method",
      "This removes the saved method and revokes it with Paystack. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            remove.mutate(item.id, {
              onError: (err: Error) => Alert.alert("Couldn't remove", err.message),
            }),
        },
      ],
    );
  }

  const list = methods ?? [];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

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
          Payment methods
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        >
          {list.length === 0 ? (
            <View className="items-center justify-center px-6" style={{ paddingTop: 56 }}>
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "#eff6ff" }}
              >
                <Ionicons name="card-outline" size={28} color="#2563eb" />
              </View>
              <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
                No saved payment methods
              </Text>
              <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                When you pay an invoice, your card or mobile money is securely saved
                here so you can reuse it next time.
              </Text>
            </View>
          ) : (
            list.map((item) => (
              <MethodCard
                key={item.id}
                item={item}
                busy={busy}
                onSetDefault={() =>
                  setDefault.mutate(item.id, {
                    onError: (err: Error) =>
                      Alert.alert("Couldn't update", err.message),
                  })
                }
                onDelete={() => confirmDelete(item)}
              />
            ))
          )}

          {/* Security note */}
          <View className="flex-row rounded-2xl p-4 mt-2" style={{ backgroundColor: "#f0fdf4" }}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#16a34a" />
            <Text style={{ color: "#15803d", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
              Your card number is never stored on our servers. Payments are handled
              securely by Paystack — we only keep a secure token to reuse.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
