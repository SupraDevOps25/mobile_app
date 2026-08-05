import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useRequestCustomPackage } from "@/hooks/usePackages";

// Slide-up form for a family to describe the care they need when no catalog
// package fits. Reuses the shared BottomSheet; the request is emailed to admins.
export function CustomPackageRequestSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const request = useRequestCustomPackage();
  const [message, setMessage] = useState("");

  function onSubmit() {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      Alert.alert(
        "Tell us a little more",
        "Please describe the care you need in a sentence or two.",
      );
      return;
    }
    request.mutate(trimmed, {
      onSuccess: () => {
        setMessage("");
        onClose();
        Alert.alert(
          "Request sent",
          "Thanks! Our team will review what you need and reach out to you soon.",
        );
      },
      onError: (err: Error) =>
        Alert.alert("Couldn't send request", err.message),
    });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Tell us what you need">
      <Text className="text-muted" style={{ fontSize: 13, lineHeight: 19, marginBottom: 4 }}>
        No package fits your situation? Describe the care your loved one needs and
        our team will put together the right plan for you.
      </Text>

      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="e.g. My mother needs help with mobility and medication twice a day, plus weekend physiotherapy…"
        placeholderTextColor="#9ca3af"
        multiline
        maxFontSizeMultiplier={1.2}
        style={{
          minHeight: 120,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#f9fafb",
          borderRadius: 14,
          padding: 12,
          fontSize: 14,
          color: "#111827",
          textAlignVertical: "top",
          marginTop: 12,
        }}
      />

      <View className="flex-row items-center" style={{ gap: 6, marginTop: 10 }}>
        <Ionicons name="mail-outline" size={14} color="#9ca3af" />
        <Text className="text-muted" style={{ fontSize: 12, flex: 1, lineHeight: 17 }}>
          We&apos;ll use the contact details on your account — no need to re-enter them.
        </Text>
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={request.isPending}
        className="rounded-2xl items-center justify-center mt-4 flex-row"
        style={{ backgroundColor: request.isPending ? "#93a4c9" : "#1e3a8a", paddingVertical: 14, gap: 8 }}
      >
        {request.isPending && <ActivityIndicator color="#ffffff" size="small" />}
        <Text className="text-white font-bold" style={{ fontSize: 15 }}>
          Send request
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
