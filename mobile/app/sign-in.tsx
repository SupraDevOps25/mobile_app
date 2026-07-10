import { zodResolver } from "@hookform/resolvers/zod";
import { CommonActions } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
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
import { useAuth } from "@/hooks/useAuth";
import { signInSchema, type SignInFormValues } from "@/schemas/auth.schemas";
import { authService } from "@/services/auth.service";
import { homeGroupForRole } from "@/lib/home-route";

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

// Format a Ghana phone number to +233XXXXXXXXX for the backend.
function toE164(raw: string): string {
  const digits = raw.startsWith("0") ? raw.slice(1) : raw;
  return `+233${digits}`;
}

export default function SignInScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { top, bottom } = useSafeAreaInsets();
  const { saveSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { emailOrPhone: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: SignInFormValues) => {
      // Convert Ghana phone to +233 format; emails pass through unchanged
      const emailOrPhone = values.emailOrPhone.includes("@")
        ? values.emailOrPhone
        : toE164(values.emailOrPhone);
      return authService.login({ emailOrPhone, password: values.password });
    },
    onSuccess: async ({ accessToken }) => {
      const user = await saveSession(accessToken);
      // Family / caregiver / coordinator each land on their own tab group
      const home = homeGroupForRole(user.role);
      // Reset the entire navigation stack — user cannot swipe back to auth screens
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: home }] }),
      );
    },
    onError: (err: Error) => {
      Alert.alert("Sign in failed", err.message);
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
          paddingTop: top + 24,
          paddingBottom: bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="flex-row items-center justify-center gap-2 mb-8">
          <Image
            source={require("../assets/images/logo-blue1.png")}
            className="w-16 h-16"
            resizeMode="contain"
          />
          <Text className="text-brand text-4xl font-bold">Supracarer</Text>
        </View>

        <Text className="text-foreground text-2xl font-bold text-center mb-8">
          Nice to see you again
        </Text>
        <Text
          className="text-muted text-center"
          style={{ fontSize: 14, lineHeight: 20, marginTop: -24, marginBottom: 24 }}
        >
          Sign in with your email or Ghana phone number.
        </Text>

        <Controller
          control={control}
          name="emailOrPhone"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Email or phone number"
              placeholder="Email or phone number (e.g. 0244123456)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.emailOrPhone?.message}
              inputContainerStyle={AUTH_INPUT_STYLE}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
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

        {/* Remember me + Forgot password */}
        <View className="flex-row items-center justify-between mb-6 -mt-1">
          <View className="flex-row items-center gap-2">
            <View
              className="w-5 h-5 rounded border-gray-300"
              style={{ borderWidth: 1.5 }}
            />
            <Text className="text-muted text-sm">Remember me</Text>
          </View>
          <Pressable onPress={() => Alert.alert("Coming soon")}>
            <Text className="text-brand-btn text-sm">Forgot password?</Text>
          </Pressable>
        </View>

        <Button
          title="Sign in"
          variant="primary"
          loading={isPending}
          onPress={handleSubmit((values) => mutate(values))}
        />

        {/*
        Divider and social sign-in are parked for the MVP. Re-enable this block
        when Google/Apple auth is configured end-to-end.

        <View className="flex-row items-center my-7 gap-4">
          <View className="flex-1 bg-border" style={{ height: 1 }} />
          <Text className="text-muted text-sm">Or</Text>
          <View className="flex-1 bg-border" style={{ height: 1 }} />
        </View>

        <Pressable
          onPress={() => Alert.alert("Coming soon", "Google sign-in not yet available.")}
          className="bg-black rounded-full py-4 flex-row items-center justify-center gap-3 mb-3"
        >
          <FontAwesome name="google" size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-base">
            Sign in with Google
          </Text>
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Coming soon", "Apple sign-in not yet available.")}
          className="bg-black rounded-full py-4 flex-row items-center justify-center gap-3"
        >
          <FontAwesome name="apple" size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-base">
            Sign in with Apple ID
          </Text>
        </Pressable>
        */}

        {/* Sign up link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-muted text-md">Don&apos;t have an account? </Text>
          <Pressable onPress={() => router.push("/sign-up" as any)}>
            <Text className="text-brand-btn text-md font-semibold">
              Sign up now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
