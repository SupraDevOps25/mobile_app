import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { ROLES, type RoleId } from "@/constants/roles";
import { authService } from "@/services/auth.service";
import type { Role } from "@/types/auth";

export default function RoleSelectionScreen() {
  const [selected, setSelected] = useState<RoleId>("FAMILY");
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  // Sign-up form data passed as params from sign-up.tsx
  const { firstName, lastName, email, phone, password } =
    useLocalSearchParams<{
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
    }>();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      authService.register({
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        email: email ?? "",
        phone: phone ?? "",
        password: password ?? "",
        role: selected as Role,
      }),
    onSuccess: () => {
      // Registration complete — navigate to email-pending screen.
      // Using replace so user can't press Back to role-selection after submit.
      router.replace({
        pathname: "/email-pending" as any,
        params: { email },
      });
    },
    onError: (err: Error) => {
      Alert.alert("Registration failed", err.message);
    },
  });

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: top + 84, paddingBottom: bottom + 16 }}
    >
      <StatusBar style="dark" />

      {/* Logo */}
      <View className="items-center mb-10">
        <Image
          source={require("../assets/images/logo-blue2.png")}
          className="w-20 h-20"
          resizeMode="contain"
        />
      </View>

      <Text className="text-foreground text-3xl font-bold text-center">
        I am a...
      </Text>
      <Text className="text-muted text-md text-center mt-2 mb-8">
        Select your role to complete registration
      </Text>

      {/* Role cards */}
      <View className="gap-3">
        {ROLES.map((role) => {
          const isSelected = selected === role.id;
          return (
            <Pressable
              key={role.id}
              onPress={() => setSelected(role.id as RoleId)}
              className="flex-row items-center p-4 rounded-2xl border-2"
              style={{
                borderColor: isSelected ? "#1e3a8a" : "#e5e7eb",
                backgroundColor: isSelected
                  ? "rgba(30,58,138,0.04)"
                  : "#ffffff",
              }}
            >
              {/* Icon */}
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(30,58,138,0.1)"
                    : "#f3f4f6",
                }}
              >
                <Text style={{ fontSize: 18 }}>{role.emoji}</Text>
              </View>

              {/* Label + description */}
              <View className="flex-1">
                <Text className="text-foreground font-bold text-md">
                  {role.label}
                </Text>
                <Text className="text-muted text-sm mt-0.5">{role.desc}</Text>
              </View>

              {/* Radio indicator */}
              <View
                className="w-5 h-5 rounded-full items-center justify-center border-2"
                style={{ borderColor: isSelected ? "#1e3a8a" : "#d1d5db" }}
              >
                {isSelected && (
                  <View className="w-2.5 h-2.5 rounded-full bg-brand" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <Button
        title="Create Account"
        variant="navy"
        loading={isPending}
        onPress={() => mutate()}
      />
    </View>
  );
}
