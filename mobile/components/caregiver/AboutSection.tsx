import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = { bio: string };

const MAX_CHARS = 120;

export function AboutSection({ bio }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > MAX_CHARS;
  const displayed = expanded || !isLong ? bio : bio.slice(0, MAX_CHARS) + "…";

  return (
    <View className="mx-5 mb-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#f9fafb" }}>
      <Text className="text-foreground font-semibold mb-3" style={{ fontSize: 13, letterSpacing: 0.5 }}>
        ABOUT
      </Text>
      <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 22, color: "#374151" }}>
        {displayed}
      </Text>
      {isLong && (
        <Pressable onPress={() => setExpanded((v) => !v)} className="mt-2">
          <Text style={{ color: "#2563eb", fontSize: 14, fontWeight: "600" }}>
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
