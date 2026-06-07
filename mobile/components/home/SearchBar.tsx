import Ionicons from "@expo/vector-icons/Ionicons";
import { TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search services or caregivers...",
}: Props) {
  return (
    <View
      className="flex-row items-center rounded-full px-4 gap-3"
      style={{ backgroundColor: "#f3f4f6", height: 48 }}
    >
      <Ionicons name="search-outline" size={18} color="#9ca3af" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className="flex-1 text-foreground"
        style={{ fontSize: 14 }}
      />
    </View>
  );
}
