import { type ReactNode } from "react";
import {
  Text,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface InputProps extends TextInputProps {
  error?: string;
  inputContainerStyle?: StyleProp<ViewStyle>;
  label?: string;
  rightIcon?: ReactNode;
}

export function Input({
  error,
  inputContainerStyle,
  label,
  rightIcon,
  style,
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-foreground font-semibold mb-2 ml-1" style={{ fontSize: 13 }}>
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center border rounded-full px-5 bg-input-bg ${
          error ? "border-destructive" : "border-border"
        }`}
        style={inputContainerStyle}
      >
        <TextInput
          className="flex-1 py-4 text-foreground text-base"
          placeholderTextColor="#9CA3AF"
          style={style}
          {...props}
        />
        {rightIcon}
      </View>
      {error ? (
        <Text className="text-destructive text-xs mt-1 ml-5">{error}</Text>
      ) : null}
    </View>
  );
}
