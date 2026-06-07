import { zodResolver } from "@hookform/resolvers/zod";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
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
import { authService } from "@/services/auth.service";
import { signUpSchema, type SignUpFormValues } from "@/schemas/auth.schemas";

export default function SignUpScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  // Call backend to verify email + phone uniqueness before navigating to role selection.
  const { mutate: checkAndContinue, isPending } = useMutation({
    mutationFn: (values: SignUpFormValues) =>
      authService.checkAvailability(values.email, values.phone),
    onSuccess: (_, values) => {
      // values.phone is already +233XXXXXXXXX from Zod transform
      router.push({
        pathname: "/role-selection" as any,
        params: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          password: values.password,
        },
      });
    },
    onError: (err: Error) => {
      // Surface conflict as a field-level error on the relevant field
      if (err.message.toLowerCase().includes("email")) {
        setError("email", { message: err.message });
      } else if (err.message.toLowerCase().includes("phone")) {
        setError("phone", { message: err.message });
      } else {
        Alert.alert("Error", err.message);
      }
    },
  });

  const onContinue = handleSubmit((values) => checkAndContinue(values));

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
          Let&apos;s Get Started
        </Text>

        <Controller
          control={control}
          name="firstName"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="First name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={errors.firstName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="Last name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={errors.lastName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="Email address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="Ghana phone number (e.g. 0244123456)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="Password (min. 8 characters)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
              error={errors.password?.message}
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

        <Button
          title="Continue"
          variant="primary"
          loading={isPending}
          onPress={onContinue}
          className="mt-2"
        />

        {/* Divider */}
        <View className="flex-row items-center my-7 gap-4">
          <View className="flex-1 bg-border" style={{ height: 1 }} />
          <Text className="text-muted text-sm">Or</Text>
          <View className="flex-1 bg-border" style={{ height: 1 }} />
        </View>

        {/* Social sign-up (UI only) */}
        <Pressable
          onPress={() => Alert.alert("Coming soon", "Google sign-up not yet available.")}
          className="bg-black rounded-full py-4 flex-row items-center justify-center gap-3 mb-3"
        >
          <FontAwesome name="google" size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-base">
            Sign up with Google
          </Text>
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Coming soon", "Apple sign-up not yet available.")}
          className="bg-black rounded-full py-4 flex-row items-center justify-center gap-3"
        >
          <FontAwesome name="apple" size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-base">
            Sign up with Apple ID
          </Text>
        </Pressable>

        {/* Sign in link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-muted text-md">Already have an account? </Text>
          <Pressable onPress={() => router.push("/sign-in" as any)}>
            <Text className="text-brand-btn text-md font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
