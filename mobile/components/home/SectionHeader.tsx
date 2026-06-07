import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  onSeeAll?: () => void;
};

export function SectionHeader({ title, onSeeAll }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-foreground text-lg font-bold">{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>
            See all
          </Text>
        </Pressable>
      )}
    </View>
  );
}
