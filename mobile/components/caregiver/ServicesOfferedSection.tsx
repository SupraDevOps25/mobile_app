import { Text, View } from "react-native";

type Props = { services: string[] };

function Chip({ label }: { label: string }) {
  return (
    <View
      className="rounded-full px-3 py-1.5 mr-2 mb-2"
      style={{ backgroundColor: "#EEF2FF" }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#4f46e5" }}>
        {label}
      </Text>
    </View>
  );
}

export function ServicesOfferedSection({ services }: Props) {
  return (
    <View className="mx-5 mb-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#f9fafb" }}>
      <Text className="text-foreground font-semibold mb-3" style={{ fontSize: 13, letterSpacing: 0.5 }}>
        SERVICES OFFERED
      </Text>
      <View className="flex-row flex-wrap">
        {services.map((s) => (
          <Chip key={s} label={s} />
        ))}
      </View>
    </View>
  );
}
