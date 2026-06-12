import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VisitsScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: top + 24 }}>
      <Text className="text-foreground text-2xl font-bold mb-1">Visits</Text>
      <Text className="text-muted text-sm">Your visit history is coming soon.</Text>
    </View>
  );
}
