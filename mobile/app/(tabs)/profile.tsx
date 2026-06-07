import { useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
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
      <Text className="text-foreground text-2xl font-bold mb-1">Profile</Text>
      <Text className="text-muted text-sm mb-8">{user?.email}</Text>

      <Text className="text-muted text-sm mb-10">
        Full profile coming soon.
      </Text>

      <Button title="Log out" variant="destructive" onPress={handleLogout} />
    </View>
  );
}
