import { Pressable, Text, View } from "react-native";

type Props = {
  durations: string[];
  selected: string;
  onSelect: (d: string) => void;
};

export function DurationPicker({ durations, selected, onSelect }: Props) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {durations.map((d) => {
        const isSelected = d === selected;
        return (
          <Pressable
            key={d}
            onPress={() => onSelect(d)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: isSelected ? "#1e3a8a" : "#f3f4f6",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isSelected ? "700" : "500",
                color: isSelected ? "#ffffff" : "#374151",
              }}
            >
              {d}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
