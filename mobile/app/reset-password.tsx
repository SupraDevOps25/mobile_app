import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schemas";
import { authService } from "@/services/auth.service";

const AUTH_INPUT_STYLE = {
  backgroundColor: "#ffffff",
  borderColor: "#dbe2ea",
  borderWidth: 1.5,
  minHeight: 58,
  shadowColor: "#0f172a",
  shadowOpacity: 0.04,
  shadowRadius: 7,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const reset = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      authService.resetPassword({
        emailOrPhone: identifier ?? "",
        code: values.code.trim(),
        newPassword: values.password,
      }),
    onSuccess: () => {
      Alert.alert(
        "Password reset",
        "Your password has been changed. Please sign in with your new password.",
        [{ text: "Sign in", onPress: () => router.replace("/sign-in" as any) }],
      );
    },
    onError: (err: Error) => {
      Alert.alert("Couldn't reset password", err.message);
    },
  });

  const resend = useMutation({
    mutationFn: () => authService.forgotPassword(identifier ?? ""),
    onSuccess: () =>
      Alert.alert("Code sent", "We've sent you a new reset code."),
    onError: (err: Error) => Alert.alert("Something went wrong", err.message),
  });

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: top + 12,
          paddingBottom: bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <View
          className="items-center justify-center rounded-full self-center mb-6"
          style={{ width: 84, height: 84, backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="shield-checkmark-outline" size={40} color="#1e3a8a" />
        </View>

        <Text className="text-foreground text-2xl font-bold text-center mb-3">
          Enter your reset code
        </Text>
        <Text
          className="text-muted text-center mb-8"
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          We sent a 6-digit code to your email. Enter it below with your new
          password. The code expires in 15 minutes.
        </Text>

        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="6-digit code"
              placeholder="123456"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.code?.message}
              inputContainerStyle={AUTH_INPUT_STYLE}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="New password"
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
              error={errors.password?.message}
              inputContainerStyle={AUTH_INPUT_STYLE}
              rightIcon={
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Text className="text-muted text-sm pr-1">
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
              error={errors.confirmPassword?.message}
              inputContainerStyle={AUTH_INPUT_STYLE}
            />
          )}
        />

        <View style={{ marginTop: 8 }}>
          <Button
            title="Reset password"
            variant="primary"
            loading={reset.isPending}
            onPress={handleSubmit((values) => reset.mutate(values))}
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-muted text-md">Didn&apos;t get a code? </Text>
          <Pressable onPress={() => resend.mutate()} disabled={resend.isPending}>
            <Text className="text-brand-btn text-md font-semibold">
              {resend.isPending ? "Sending…" : "Resend"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
