import { Image, Text, View } from "react-native";
import { avatarColor } from "@/lib/avatar";

// A round avatar that shows an uploaded photo when available, otherwise the
// person's initials on a colour derived from their name.
export function Avatar({
  name,
  initials,
  photoUrl,
  size = 44,
  fontSize,
  bg,
}: {
  name: string;
  initials: string;
  photoUrl?: string | null;
  size?: number;
  fontSize?: number;
  /** Override the initials background (defaults to a colour from the name). */
  bg?: string;
}) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg ?? avatarColor(name),
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontWeight: "700",
          fontSize: fontSize ?? Math.round(size * 0.34),
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
