import { Switch, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ title, subtitle, value, onValueChange }: Props) {
  return (
    <View
      className="flex-row items-center bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
          {title}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#16a34a" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
