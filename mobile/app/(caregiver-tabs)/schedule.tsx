import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScheduleScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: top + 24 }}>
      <Text className="text-foreground text-2xl font-bold mb-1">Schedule</Text>
      <Text className="text-muted text-sm">Your weekly schedule is coming soon.</Text>
    </View>
  );
}
