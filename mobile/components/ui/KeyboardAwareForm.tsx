import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// Standard scroll container for forms. A focused input scrolls to sit directly
// above the keyboard on both iOS and Android — including fields at the very end
// of the form. Drop it in place of a ScrollView; render any sticky footer as a
// sibling after it. Requires <KeyboardProvider> at the app root (app/_layout).
export function KeyboardAwareForm({
  children,
  contentContainerStyle,
  bottomOffset = 16,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  // Gap kept between the focused field and the top of the keyboard.
  bottomOffset?: number;
}) {
  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
