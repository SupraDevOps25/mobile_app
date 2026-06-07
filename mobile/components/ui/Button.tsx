import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
} from "react-native";

export type ButtonVariant = "primary" | "navy" | "dark";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

// Hex values instead of NativeWind classes so `className` stays static
// and never triggers NativeWind's variable-change warning.
const BG_COLOR: Record<ButtonVariant, string> = {
  primary: "#2563eb", // brand-btn
  navy: "#1e3a8a",    // brand
  dark: "#000000",
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
      // className is always a static string — no dynamic parts
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
