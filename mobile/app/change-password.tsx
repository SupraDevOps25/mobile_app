import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useChangePassword } from "@/hooks/useProfile";

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <>
      <Text
        className="text-foreground font-semibold mb-2 ml-1"
        style={{ fontSize: 13 }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center border rounded-full px-5 mb-4"
        style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={hidden}
          autoCapitalize="none"
          maxFontSizeMultiplier={1.2}
          style={{ flex: 1, paddingVertical: 16, fontSize: 14, color: "#111827" }}
        />
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#9ca3af"
          />
        </Pressable>
      </View>
    </>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const changePassword = useChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function onSubmit() {
    if (next.length < 8) {
      Alert.alert("Weak password", "New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Passwords don't match", "Re-enter your new password.");
      return;
    }
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () =>
          Alert.alert("Password changed", "Use your new password next time you sign in.", [
            { text: "Done", onPress: () => router.back() },
          ]),
        onError: (err: Error) => Alert.alert("Couldn't change password", err.message),
      },
    );
  }

  const canSubmit = current.length > 0 && next.length > 0 && confirm.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior="padding"
    >
      <View className="flex-1 bg-background">
        <StatusBar style="dark" />

        {/* Header */}
        <View
          className="flex-row items-center px-5 pb-3"
          style={{ paddingTop: top + 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
            Change password
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <View
            className="flex-row items-center rounded-2xl p-4 mb-5 mt-2"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#16a34a" />
            <Text
              style={{ color: "#166534", fontSize: 12.5, lineHeight: 18, marginLeft: 8, flex: 1 }}
            >
              Choose a strong password with at least 8 characters. You&apos;ll
              stay signed in on this device.
            </Text>
          </View>

          <PasswordField
            label="Current password"
            value={current}
            onChangeText={setCurrent}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New password"
            value={next}
            onChangeText={setNext}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter new password"
          />
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
            title="Update password"
            variant="navy"
            loading={changePassword.isPending}
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
