import { Pressable, Text, View } from "react-native";

export type TimeSlot = { time: string; available: boolean };

type Props = {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
};

function Slot({
  slot,
  selected,
  onPress,
}: {
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!slot.available}
      style={{
        flex: 1,
        margin: 4,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: selected
          ? "#1e3a8a"
          : slot.available
          ? "#f3f4f6"
          : "#f9fafb",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? "700" : "500",
          color: selected
            ? "#ffffff"
            : slot.available
            ? "#111827"
            : "#d1d5db",
        }}
      >
        {slot.time}
      </Text>
    </Pressable>
  );
}

export function TimeSlotPicker({ slots, selectedTime, onSelectTime }: Props) {
  // Render in rows of 3
  const rows: TimeSlot[][] = [];
  for (let i = 0; i < slots.length; i += 3) {
    rows.push(slots.slice(i, i + 3));
  }

  return (
    <View style={{ marginHorizontal: -4 }}>
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row">
          {row.map((slot) => (
            <Slot
              key={slot.time}
              slot={slot}
              selected={selectedTime === slot.time}
              onPress={() => onSelectTime(slot.time)}
            />
          ))}
          {/* Pad incomplete last row */}
          {row.length < 3 &&
            Array(3 - row.length)
              .fill(null)
              .map((_, i) => (
                <View key={`pad-${i}`} style={{ flex: 1, margin: 4 }} />
              ))}
        </View>
      ))}
    </View>
  );
}
