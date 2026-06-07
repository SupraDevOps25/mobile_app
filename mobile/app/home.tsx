import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/sign-in" as any);
        },
      },
    ]);
  }

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: top + 24 }}
    >
      <StatusBar style="dark" />

      <Text className="text-foreground text-2xl font-bold mb-1">
        Welcome back!
      </Text>
      <Text className="text-muted text-base mb-1">{user?.email}</Text>
      <Text className="text-muted text-sm mb-12 capitalize">
        {user?.role?.toLowerCase()} account
      </Text>

      <Text className="text-muted text-sm text-center mb-8">
        Dashboard coming soon — home screens are next.
      </Text>

      <Pressable
        onPress={handleLogout}
        className="rounded-full py-4 items-center"
        style={{ backgroundColor: "#dc2626" }}
      >
        <Text className="text-white font-semibold text-base">Log Out</Text>
      </Pressable>
    </View>
  );
}
