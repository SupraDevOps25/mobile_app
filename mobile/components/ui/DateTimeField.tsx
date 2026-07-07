import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

const GREEN = "#0d9488";

// Tomorrow at 8:00 AM — a sensible default landing point for a new picker.
function defaultDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Cross-platform date + time picker. On Android it chains the native date then
 * time dialogs; on iOS it shows an inline spinner in a bottom sheet with Done.
 */
export function DateTimeField({
  value,
  onChange,
  minimumDate,
  placeholder = "Pick a date & time",
  disabled,
}: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? defaultDate());

  function openAndroid() {
    const base = value ?? defaultDate();
    DateTimePickerAndroid.open({
      value: base,
      mode: "date",
      minimumDate,
      onChange: (dateEvent, date) => {
        if (dateEvent.type !== "set" || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          is24Hour: false,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== "set" || !time) return;
            const combined = new Date(date);
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(combined);
          },
        });
      },
    });
  }

  function open() {
    if (disabled) return;
    if (Platform.OS === "android") {
      openAndroid();
    } else {
      setDraft(value ?? defaultDate());
      setIosOpen(true);
    }
  }

  return (
    <>
      <Pressable
        onPress={open}
        disabled={disabled}
        className="flex-row items-center rounded-2xl px-4 py-3"
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: disabled ? "#f3f4f6" : "#f9fafb",
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={GREEN} />
        <Text
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: 14,
            fontWeight: value ? "600" : "400",
            color: value ? "#111827" : "#9ca3af",
          }}
        >
          {value ? formatDateTime(value) : placeholder}
        </Text>
        {!disabled && (
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        )}
      </Pressable>

      {Platform.OS === "ios" && (
        <Modal visible={iosOpen} transparent animationType="fade">
          <Pressable
            onPress={() => setIosOpen(false)}
            style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}
            >
              <View className="flex-row items-center justify-between px-5 pt-4">
                <Pressable onPress={() => setIosOpen(false)} hitSlop={8}>
                  <Text style={{ color: "#6b7280", fontSize: 15 }}>Cancel</Text>
                </Pressable>
                <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                  Pick date &amp; time
                </Text>
                <Pressable
                  onPress={() => {
                    onChange(draft);
                    setIosOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text style={{ color: GREEN, fontSize: 15, fontWeight: "700" }}>
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="datetime"
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_, d) => d && setDraft(d)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
