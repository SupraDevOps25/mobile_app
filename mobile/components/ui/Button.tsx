import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
  type ViewStyle,
} from "react-native";

export type ButtonVariant = "primary" | "navy" | "dark" | "destructive";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

const BG_COLOR: Record<ButtonVariant, string> = {
  primary: "#2563eb",
  navy: "#1e3a8a",
  dark: "#000000",
  destructive: "#dc2626",
};

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading;

  return (
    <Pressable
      disabled={isDisabled}
      className={`rounded-full py-4 items-center justify-center ${className}`}
      style={[
        { backgroundColor: BG_COLOR[variant], opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text className="text-white font-semibold text-base">{title}</Text>
      )}
    </Pressable>
  );
}
