import { View } from "react-native";

// Soft off-white overlapping circles for dark (navy/teal) cards. Render as the
// first child of a card whose style has `overflow: "hidden"`; content after it
// sits on top. Non-interactive so it never intercepts touches.
export function CardPattern() {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -46,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 6,
          right: 40,
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -44,
          left: -18,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      />
    </View>
  );
}
