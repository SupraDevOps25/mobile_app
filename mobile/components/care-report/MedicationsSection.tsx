import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Pressable, Text, View } from "react-native";
import type { Medication } from "@/constants/nurse-cases";

type Props = {
  medications: Medication[];
  given: string[]; // ids of medications marked as administered
  onToggle: (id: string) => void;
};

export function MedicationsSection({ medications, given, onToggle }: Props) {
  return (
    <View
      className="bg-card rounded-2xl px-4 py-1"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {medications.map((med) => {
        const checked = given.includes(med.id);
        return (
          <Pressable
            key={med.id}
            onPress={() => onToggle(med.id)}
            className="flex-row items-center py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons name="medkit-outline" size={16} color="#2563eb" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                {med.name}
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
                {med.detail}
              </Text>
            </View>
            <Ionicons
              name={checked ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={checked ? "#16a34a" : "#d1d5db"}
            />
          </Pressable>
        );
      })}

      <Pressable
        onPress={() =>
          Alert.alert("Coming soon", "Adding extra medications is on the way.")
        }
        className="flex-row items-center py-3"
      >
        <Ionicons name="add" size={18} color="#2563eb" />
        <Text style={{ color: "#2563eb", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>
          Add medication
        </Text>
      </Pressable>
    </View>
  );
}
