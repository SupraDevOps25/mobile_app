import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

// The shared card surface: hairline border + soft shadow. Spread onto any white
// card so every account's cards share one consistent look (padding/size stays
// each card's own — only the border and shadow are unified).
export const CARD_SURFACE = {
  borderWidth: 1,
  borderColor: "#ebedf0",
  shadowColor: "#0f172a",
  shadowOpacity: 0.04,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

// The app's standard white content card: white background, hairline border and
// a soft shadow. Matches the visit/schedule cards so every account shares one
// card look. Pass `onPress` to make it tappable; otherwise it's a plain View.
// Extra `style` is merged last so callers can tweak spacing (margins, padding).
export function AppCard({
  children,
  onPress,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const cardStyle: StyleProp<ViewStyle> = [CARD_SURFACE, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="bg-card rounded-2xl p-4"
        style={cardStyle}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className="bg-card rounded-2xl p-4" style={cardStyle}>
      {children}
    </View>
  );
}
