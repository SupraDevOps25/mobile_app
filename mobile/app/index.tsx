import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function SplashScreen() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // wait for SecureStore to rehydrate

    async function proceed() {
      if (token) {
        router.replace("/(tabs)" as any);
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
  }, [isLoading, token, router]);

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
