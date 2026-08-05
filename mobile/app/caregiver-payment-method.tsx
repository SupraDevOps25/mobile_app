import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { KeyboardAwareForm } from "@/components/ui/KeyboardAwareForm";
import {
  useCaregiverProfile,
  useUpdateCaregiverPayoutMethod,
} from "@/hooks/useCaregiverProfile";
import type { ApiPayoutChannel } from "@/services/caregiver.service";

const GREEN = "#16a34a";
const MOMO_NETWORKS = ["MTN", "Telecel", "AirtelTigo"];

function Label({ children, hint }: { children: string; hint?: string }) {
  return (
    <>
      <Text
        className="text-muted font-semibold"
        style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: hint ? 4 : 10 }}
      >
        {children.toUpperCase()}
      </Text>
      {hint ? (
        <Text style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 17, marginBottom: 10 }}>
          {hint}
        </Text>
      ) : null}
    </>
  );
}

const INPUT = {
  flex: 1,
  paddingVertical: 14,
  marginLeft: 8,
  fontSize: 16,
  color: "#111827",
} as const;

const INPUT_WRAP = {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#f9fafb",
} as const;

export default function CaregiverPaymentMethodScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { data: profile, isLoading } = useCaregiverProfile();
  const update = useUpdateCaregiverPayoutMethod();

  const [method, setMethod] = useState<ApiPayoutChannel>("MOMO");
  // MoMo
  const [momoNetwork, setMomoNetwork] = useState<string | null>(null);
  const [momoNumber, setMomoNumber] = useState("");
  const [momoName, setMomoName] = useState("");
  // Bank
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  useEffect(() => {
    const p = profile?.payout;
    if (!p) return;
    if (p.method) setMethod(p.method);
    setMomoNetwork(p.momoNetwork);
    setMomoNumber(p.momoNumber ?? "");
    setMomoName(p.momoName ?? "");
    setBankName(p.bankName ?? "");
    setBankAccountNumber(p.bankAccountNumber ?? "");
    setBankAccountName(p.bankAccountName ?? "");
  }, [profile]);

  const canSave =
    method === "MOMO"
      ? Boolean(momoNetwork && momoNumber.trim() && momoName.trim())
      : Boolean(bankName.trim() && bankAccountNumber.trim() && bankAccountName.trim());

  async function onSave() {
    try {
      await update.mutateAsync(
        method === "MOMO"
          ? { method, momoNetwork: momoNetwork ?? undefined, momoNumber: momoNumber.trim(), momoName: momoName.trim() }
          : {
              method,
              bankName: bankName.trim(),
              bankAccountNumber: bankAccountNumber.trim(),
              bankAccountName: bankAccountName.trim(),
            },
      );
      Alert.alert("Saved", "Your payout method has been updated.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : "Try again");
    }
  }

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
          Payment method
        </Text>
      </View>

      {isLoading || !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GREEN} />
        </View>
      ) : (
        <>
          <KeyboardAwareForm
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 96 }}
          >
            <View className="rounded-2xl p-4 flex-row" style={{ backgroundColor: "#f0fdf4", marginTop: 4 }}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GREEN} />
              <Text style={{ color: "#15803d", fontSize: 12.5, lineHeight: 18, marginLeft: 8, flex: 1 }}>
                This is where Supracarer sends your monthly payouts. Make sure the
                name matches your account exactly.
              </Text>
            </View>

            {/* Channel selector */}
            <Label>Payout channel</Label>
            <View className="flex-row" style={{ gap: 10 }}>
              {([
                { key: "MOMO", label: "Mobile money", icon: "phone-portrait-outline" },
                { key: "BANK", label: "Bank transfer", icon: "business-outline" },
              ] as const).map((opt) => {
                const active = method === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setMethod(opt.key)}
                    className="flex-1 rounded-2xl items-center justify-center"
                    style={{
                      paddingVertical: 16,
                      borderWidth: 1,
                      borderColor: active ? GREEN : "#e5e7eb",
                      backgroundColor: active ? "#f0fdf4" : "#f9fafb",
                    }}
                  >
                    <Ionicons name={opt.icon} size={22} color={active ? GREEN : "#9ca3af"} />
                    <Text
                      style={{ fontSize: 14, fontWeight: "700", marginTop: 6, color: active ? "#15803d" : "#6b7280" }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {method === "MOMO" ? (
              <>
                <Label>Network</Label>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {MOMO_NETWORKS.map((net) => {
                    const active = momoNetwork === net;
                    return (
                      <Pressable
                        key={net}
                        onPress={() => setMomoNetwork(net)}
                        className="rounded-full px-4 py-2"
                        style={{
                          borderWidth: 1,
                          borderColor: active ? GREEN : "#e5e7eb",
                          backgroundColor: active ? GREEN : "#f9fafb",
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#ffffff" : "#6b7280" }}>
                          {net}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Label>Mobile money number</Label>
                <View className="flex-row items-center rounded-full px-4" style={INPUT_WRAP}>
                  <Ionicons name="call-outline" size={18} color="#6b7280" />
                  <TextInput
                    value={momoNumber}
                    onChangeText={(t) => setMomoNumber(t.replace(/[^0-9]/g, ""))}
                    placeholder="0244123456"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    maxFontSizeMultiplier={1.2}
                    style={INPUT}
                  />
                </View>

                <Label>Account name</Label>
                <View className="flex-row items-center rounded-full px-4" style={INPUT_WRAP}>
                  <Ionicons name="person-outline" size={18} color="#6b7280" />
                  <TextInput
                    value={momoName}
                    onChangeText={setMomoName}
                    placeholder="Name registered on the number"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    maxFontSizeMultiplier={1.2}
                    style={INPUT}
                  />
                </View>
              </>
            ) : (
              <>
                <Label>Bank name</Label>
                <View className="flex-row items-center rounded-full px-4" style={INPUT_WRAP}>
                  <Ionicons name="business-outline" size={18} color="#6b7280" />
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. GCB Bank"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    maxFontSizeMultiplier={1.2}
                    style={INPUT}
                  />
                </View>

                <Label>Account number</Label>
                <View className="flex-row items-center rounded-full px-4" style={INPUT_WRAP}>
                  <Ionicons name="card-outline" size={18} color="#6b7280" />
                  <TextInput
                    value={bankAccountNumber}
                    onChangeText={(t) => setBankAccountNumber(t.replace(/[^0-9]/g, ""))}
                    placeholder="Account number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxFontSizeMultiplier={1.2}
                    style={INPUT}
                  />
                </View>

                <Label>Account name</Label>
                <View className="flex-row items-center rounded-full px-4" style={INPUT_WRAP}>
                  <Ionicons name="person-outline" size={18} color="#6b7280" />
                  <TextInput
                    value={bankAccountName}
                    onChangeText={setBankAccountName}
                    placeholder="Name on the bank account"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    maxFontSizeMultiplier={1.2}
                    style={INPUT}
                  />
                </View>
              </>
            )}
          </KeyboardAwareForm>

          {/* Sticky footer */}
          <View
            className="bg-white px-5 pt-3"
            style={{ paddingBottom: bottom + 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
          >
            <Button
              title="Save payout method"
              variant="navy"
              loading={update.isPending}
              disabled={!canSave}
              onPress={onSave}
            />
          </View>
        </>
      )}
    </View>
  );
}
