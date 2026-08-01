import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const email = values.email.trim();
      await authService.forgotPassword(email);
      return email;
    },
    onSuccess: (email) => {
      // Hand the email to the reset screen so the user doesn't retype it.
      router.push({
        pathname: "/reset-password" as any,
        params: { identifier: email },
      });
    },
    onError: (err: Error) => {
      Alert.alert("Something went wrong", err.message);
    },
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
          <Ionicons name="lock-closed-outline" size={40} color="#1e3a8a" />
        </View>

        <Text className="text-foreground text-2xl font-bold text-center mb-3">
          Forgot your password?
        </Text>
        <Text
          className="text-muted text-center mb-8"
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          Enter the email address on your account and we&apos;ll send you a
          6-digit code to reset your password.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              inputContainerStyle={AUTH_INPUT_STYLE}
            />
          )}
        />

        <View style={{ marginTop: 8 }}>
          <Button
            title="Send reset code"
            variant="primary"
            loading={isPending}
            onPress={handleSubmit((values) => mutate(values))}
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-muted text-md">Remembered it? </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-brand-btn text-md font-semibold">Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
