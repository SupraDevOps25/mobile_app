import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background items-center justify-center"
      style={{ paddingTop: top }}
    >
      <Text className="text-foreground text-lg font-semibold">Search</Text>
      <Text className="text-muted text-sm mt-2">Coming soon</Text>
    </View>
  );
}
