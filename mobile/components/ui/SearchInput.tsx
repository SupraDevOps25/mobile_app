import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Pressable,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface SearchInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  /** Accent colour used for the focus ring, icon and clear button. */
  accent?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable pill search field. Purely presentational — the owning screen holds
 * the query in state and does the filtering. Shows a leading search icon and a
 * trailing clear button once there's text. Used on the family, caregiver and
 * coordinator dashboards for quick lookups.
 */
export function SearchInput({
  value,
  onChangeText,
  accent = "#1e3a8a",
  placeholder = "Search",
  containerStyle,
  ...props
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const hasText = value.length > 0;

  return (
    <View
      className="flex-row items-center rounded-full px-4"
      style={[
        {
          backgroundColor: "#ffffff",
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? accent : "#e5e7eb",
          height: 48,
          shadowColor: "#0f172a",
          shadowOpacity: focused ? 0.08 : 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: focused ? 2 : 1,
        },
        containerStyle,
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? accent : "#9ca3af"}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-foreground"
        style={{ fontSize: 15, marginLeft: 8, paddingVertical: 0 }}
        {...props}
      />
      {hasText ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          className="items-center justify-center"
        >
          <Ionicons name="close-circle" size={18} color={accent} />
        </Pressable>
      ) : null}
    </View>
  );
}
