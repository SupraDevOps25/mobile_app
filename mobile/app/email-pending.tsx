import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";

export default function EmailPendingScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resent, setResent] = useState(false);

  const { mutate: resend, isPending } = useMutation({
    mutationFn: () => authService.resendVerification(email ?? ""),
    onSuccess: () => {
      setResent(true);
      Alert.alert("Email sent", "A new verification link has been sent to your inbox.");
    },
    onError: (err: Error) => {
      Alert.alert("Failed to resend", err.message);
    },
  });

  return (
    <View
      className="flex-1 bg-background px-6 items-center justify-center"
      style={{ paddingTop: top }}
    >
      <StatusBar style="dark" />

      {/* Icon */}
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: "rgba(37,99,235,0.08)" }}
      >
        <Text style={{ fontSize: 44 }}>📧</Text>
      </View>

      <Text className="text-foreground text-2xl font-bold text-center mb-3">
        Check your inbox
      </Text>

      <Text className="text-muted text-base text-center leading-6 mb-2">
        We sent a verification link to
      </Text>
      <Text className="text-brand font-semibold text-base text-center mb-8">
        {email}
      </Text>

      <Text className="text-muted text-sm text-center leading-6 mb-10">
        Open the link in that email to activate your account, then come back here to sign in.
        Check your spam folder if you don&apos;t see it.
      </Text>

      <Button
        title="I've verified my email — Sign In"
        variant="primary"
        onPress={() => router.replace("/sign-in" as any)}
        className="w-full mb-4"
      />

      <TouchableOpacity
        onPress={() => resend()}
        disabled={isPending || resent}
        className="py-3"
      >
        <Text
          className="text-brand-btn text-sm font-semibold text-center"
          style={{ opacity: isPending || resent ? 0.5 : 1 }}
        >
          {isPending ? "Sending…" : resent ? "Email resent ✓" : "Resend verification email"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
