import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

type DetailRowProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueLine2?: string;
  rightAction?: { label: string; onPress: () => void };
};

function DetailRow({ iconName, label, value, valueLine2, rightAction }: DetailRowProps) {
  return (
    <View
      className="flex-row items-start py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
    >
      {/* Icon */}
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <Ionicons name={iconName} size={18} color="#374151" />
      </View>

      {/* Label */}
      <View className="flex-1">
        <Text className="text-muted" style={{ fontSize: 13 }}>
          {label}
        </Text>
      </View>

      {/* Value + optional action */}
      <View className="items-end" style={{ maxWidth: "55%" }}>
        <Text
          className="text-foreground font-semibold text-right"
          style={{ fontSize: 13 }}
        >
          {value}
        </Text>
        {valueLine2 && (
          <Text className="text-muted text-right" style={{ fontSize: 13, marginTop: 1 }}>
            {valueLine2}
          </Text>
        )}
        {rightAction && (
          <Pressable onPress={rightAction.onPress} hitSlop={8}>
            <Text
              style={{ fontSize: 13, color: "#2563eb", fontWeight: "600", marginTop: 2 }}
            >
              {rightAction.label}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type Props = {
  service: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  address: string;
  notes: string;
  onNotesChange: (text: string) => void;
};

export function VisitDetailsSection({
  service,
  dateLabel,
  timeLabel,
  durationLabel,
  address,
  notes,
  onNotesChange,
}: Props) {
  return (
    <View className="mx-5 rounded-2xl overflow-hidden" style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}>
      {/* Section heading */}
      <View className="px-5 pt-4 pb-2">
        <Text
          className="text-foreground font-semibold"
          style={{ fontSize: 13, letterSpacing: 0.5 }}
        >
          VISIT DETAILS
        </Text>
      </View>

      <View className="px-5">
        <DetailRow
          iconName="medical-outline"
          label="Service"
          value={service}
        />
        <DetailRow
          iconName="calendar-outline"
          label="Date & time"
          value={dateLabel}
          valueLine2={timeLabel}
        />
        <DetailRow
          iconName="time-outline"
          label="Duration"
          value={durationLabel}
        />
        <DetailRow
          iconName="location-outline"
          label="Address"
          value={address}
          rightAction={{
            label: "Edit",
            onPress: () => Alert.alert("Coming soon", "Address editing coming soon."),
          }}
        />

        {/* Special notes */}
        <View className="py-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Ionicons name="document-text-outline" size={18} color="#374151" />
            </View>
            <Text className="text-muted" style={{ fontSize: 13 }}>
              Special notes (optional)
            </Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Add any important details for the caregiver…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              color: "#111827",
              minHeight: 72,
              textAlignVertical: "top",
            }}
          />
        </View>
      </View>
    </View>
  );
}
