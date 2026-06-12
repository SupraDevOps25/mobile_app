import { Text, TextInput, View } from "react-native";

export type Vitals = {
  bloodPressure: string;
  bloodGlucose: string;
  heartRate: string;
  temperature: string;
};

type Field = {
  key: keyof Vitals;
  label: string;
  unit: string;
  placeholder: string;
};

const FIELDS: Field[] = [
  { key: "bloodPressure", label: "Blood pressure", unit: "mmHg", placeholder: "138/88" },
  { key: "bloodGlucose", label: "Blood glucose", unit: "mmol/L", placeholder: "6.4" },
  { key: "heartRate", label: "Heart rate", unit: "bpm", placeholder: "74" },
  { key: "temperature", label: "Temperature", unit: "°C", placeholder: "36.6" },
];

type Props = {
  vitals: Vitals;
  onChange: (key: keyof Vitals, value: string) => void;
};

export function VitalsGrid({ vitals, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
      {FIELDS.map((field) => (
        <View
          key={field.key}
          className="rounded-xl px-3 py-3"
          style={{ width: "48%", backgroundColor: "#f3f4f6" }}
        >
          <Text className="text-muted font-semibold" style={{ fontSize: 10, letterSpacing: 0.5 }}>
            {field.label.toUpperCase()}
          </Text>
          <View className="flex-row items-end mt-1">
            <TextInput
              value={vitals[field.key]}
              onChangeText={(v) => onChange(field.key, v)}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              keyboardType="numbers-and-punctuation"
              className="text-foreground font-bold"
              style={{ fontSize: 18, padding: 0, minWidth: 40 }}
            />
            <Text className="text-muted" style={{ fontSize: 11, marginLeft: 4, marginBottom: 2 }}>
              {field.unit}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
