import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reusable sheet that slides up from the bottom over a dimmed backdrop. Tapping
// the backdrop or the close button dismisses it. The white surface runs to the
// very bottom edge of the phone (under the nav bar) and lifts above the keyboard
// via the keyboard-controller — which, unlike RN's KeyboardAvoidingView, works
// under Android edge-to-edge and inside a modal. Use it anywhere a lightweight
// "open from below" surface is needed.
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* Dimmed backdrop — tap to dismiss */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
          }}
        />

        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Math.max(bottom, 16),
            maxHeight: "94%",
          }}
        >
          {/* Grab handle */}
          <View className="items-center" style={{ paddingTop: 10 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#e5e7eb",
              }}
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
            <Text className="text-foreground font-bold" style={{ fontSize: 17 }}>
              {title ?? ""}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Ionicons name="close" size={18} color="#4b5563" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
