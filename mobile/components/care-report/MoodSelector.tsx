import { Pressable, Text, View } from "react-native";

export type Mood = "Poor" | "Low" | "Good" | "Great" | "Excellent";

const MOODS: { mood: Mood; emoji: string }[] = [
  { mood: "Poor", emoji: "😞" },
  { mood: "Low", emoji: "😕" },
  { mood: "Good", emoji: "🙂" },
  { mood: "Great", emoji: "😄" },
  { mood: "Excellent", emoji: "🤩" },
];

type Props = {
  selected: Mood | null;
  onSelect: (mood: Mood) => void;
};

export function MoodSelector({ selected, onSelect }: Props) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {MOODS.map(({ mood, emoji }) => {
        const active = selected === mood;
        return (
          <Pressable
            key={mood}
            onPress={() => onSelect(mood)}
            className="flex-1 items-center rounded-xl py-3"
            style={{
              borderWidth: 1,
              borderColor: active ? "#16a34a" : "#e5e7eb",
              backgroundColor: active ? "#f0fdf4" : "#ffffff",
            }}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 10,
                marginTop: 4,
                fontWeight: "600",
                color: active ? "#15803d" : "#6b7280",
              }}
            >
              {mood}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
