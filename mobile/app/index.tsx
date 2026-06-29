import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { homeGroupForRole } from "@/lib/home-route";

export default function SplashScreen() {
  const router = useRouter();
  const { token, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // wait for SecureStore to rehydrate

    async function proceed() {
      if (token) {
        // Family / caregiver / coordinator each land on their own tab group
        router.replace(`/${homeGroupForRole(user?.role)}` as any);
        return;
      }
      try {
        const seen = await AsyncStorage.getItem("onboarding_seen");
        router.replace(seen ? ("/sign-in" as any) : ("/onboarding" as any));
      } catch {
        router.replace("/onboarding" as any);
      }
    }
    void proceed();
  }, [isLoading, token, user?.role, router]);

  return (
    <View className="flex-1 bg-brand items-center justify-center">
      <StatusBar style="light" />
      <Image
        source={require("../assets/images/icon-white.png")}
        style={{ width: 130, height: 130 }}
        resizeMode="contain"
      />
    </View>
  );
}
