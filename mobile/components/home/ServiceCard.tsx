import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Alert, Pressable, Text, View } from "react-native";
import type { ServiceCategory } from "@/constants/mock-data";

type Props = {
  service: ServiceCategory;
  onPress?: () => void;
};

export function ServiceCard({ service, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress ?? (() => Alert.alert("Coming soon"))}
      className="flex-1 rounded-2xl p-4"
      style={{ backgroundColor: service.bgColor, minHeight: 115 }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${service.iconColor}22` }}
      >
        <MaterialCommunityIcons
          name={service.iconName as any}
          size={20}
          color={service.iconColor}
        />
      </View>
      <Text
        className="text-foreground font-semibold leading-5"
        style={{ fontSize: 13 }}
      >
        {service.title}
      </Text>
      <Text className="text-muted mt-1" style={{ fontSize: 12 }}>
        {service.count} caregivers
      </Text>
    </Pressable>
  );
}
