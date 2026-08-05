import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";

const NAVY = "#1e3a8a";

// Nudge shown to a family whose profile is still missing key details (gender,
// date of birth, home area). It names exactly what's outstanding and links
// straight to the personal-information screen to fill it in.
export function CompleteProfilePrompt({
  visible,
  missing,
  onClose,
  onComplete,
}: {
  visible: boolean;
  missing: string[];
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Complete your profile">
      <View style={{ paddingTop: 8, paddingBottom: 4 }}>
        <View className="items-center">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 88, height: 88, backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="person-circle-outline" size={52} color={NAVY} />
          </View>

          <Text
            className="text-foreground font-bold text-center"
            style={{ fontSize: 20, marginTop: 20 }}
          >
            A few details to add
          </Text>
          <Text
            className="text-muted text-center"
            style={{ fontSize: 14, lineHeight: 22, marginTop: 10 }}
          >
            Complete your profile so your care coordinator can reach you and
            tailor care to your family.
          </Text>
        </View>

        {/* Exactly what's still outstanding */}
        <View style={{ marginTop: 20, gap: 10 }}>
          {missing.map((label) => (
            <View
              key={label}
              className="flex-row items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <Ionicons name="ellipse-outline" size={18} color="#9ca3af" />
              <Text
                className="text-foreground"
                style={{ fontSize: 15, fontWeight: "600", marginLeft: 10 }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onComplete}
          className="rounded-full py-4 items-center flex-row justify-center w-full"
          style={{ backgroundColor: NAVY, gap: 8, marginTop: 24 }}
        >
          <Text className="text-white font-semibold" style={{ fontSize: 16 }}>
            {missing.length === 1 ? "Add this detail" : "Complete profile"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="items-center"
          style={{ marginTop: 14 }}
        >
          <Text style={{ color: "#6b7280", fontSize: 14, fontWeight: "600" }}>
            Maybe later
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
