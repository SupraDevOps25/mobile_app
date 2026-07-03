import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteAccount } from "@/hooks/useFamily";

const REMOVED = [
  "Your care plans and full care history",
  "Care recipient details",
  "Saved addresses and payment methods",
  "Invoices and notifications",
];

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { bottom, top } = useSafeAreaInsets();
  const { logout } = useAuth();
  const qc = useQueryClient();
  const del = useDeleteAccount();

  const [confirm, setConfirm] = useState("");
  const canDelete = confirm.trim().toUpperCase() === CONFIRM_WORD;

  function handleDelete() {
    del.mutate(undefined, {
      onSuccess: async () => {
        await logout();
        qc.clear();
        Alert.alert(
          "Account deleted",
          "Your account and data have been removed. We're sorry to see you go.",
        );
        router.replace("/sign-in" as any);
      },
      onError: (err: Error) => Alert.alert("Couldn't delete account", err.message),
    });
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            Delete account
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {/* Warning */}
          <View className="items-center mt-2 mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "#fef2f2" }}
            >
              <Ionicons name="warning-outline" size={30} color="#dc2626" />
            </View>
            <Text className="text-foreground font-bold text-center" style={{ fontSize: 18, marginTop: 12 }}>
              This can&apos;t be undone
            </Text>
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 20 }}>
              Deleting your account permanently removes your data from Supracarer.
            </Text>
          </View>

          {/* What gets removed */}
          <View
            className="rounded-2xl p-4"
            style={{ borderWidth: 1, borderColor: "#fee2e2", backgroundColor: "#fef2f2" }}
          >
            <Text style={{ color: "#b91c1c", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
              What will be deleted
            </Text>
            {REMOVED.map((item) => (
              <View key={item} className="flex-row items-start mb-1.5">
                <Ionicons name="close-circle" size={15} color="#dc2626" style={{ marginTop: 1 }} />
                <Text style={{ color: "#7f1d1d", fontSize: 13, marginLeft: 8, flex: 1, lineHeight: 19 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* Guard note */}
          <View className="flex-row rounded-2xl p-4 mt-3" style={{ backgroundColor: "#eff6ff" }}>
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
            <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
              If you have active care or an unpaid invoice, please end your care
              plan and settle any balance first.
            </Text>
          </View>

          {/* Type to confirm */}
          <Text className="text-foreground font-semibold mt-6 mb-2" style={{ fontSize: 13 }}>
            Type {CONFIRM_WORD} to confirm
          </Text>
          <View
            className="border rounded-2xl px-4"
            style={{ backgroundColor: "#f9fafb", borderColor: canDelete ? "#dc2626" : "#e5e7eb" }}
          >
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder={CONFIRM_WORD}
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              autoCorrect={false}
              className="text-foreground"
              style={{ fontSize: 15, paddingVertical: 14, letterSpacing: 1 }}
            />
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View
          className="bg-white px-5 pt-3"
          style={{
            paddingBottom: bottom + 12,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
          }}
        >
          <Button
            title="Delete my account"
            variant="destructive"
            loading={del.isPending}
            disabled={!canDelete}
            onPress={handleDelete}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
