import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export type VisitRowBadge = {
  label: string;
  color: string;
  bg: string;
  // When true, a small filled dot in `color` precedes the label (e.g. "live").
  dot?: boolean;
};

// Presentational list-row card: date badge + title/subtitle + status pill.
// It owns the look (shared border + shadow, layout) and knows nothing about any
// account's data model — each screen maps its own data into these plain props.
// Reused by the nurse dashboard, the assignment screen, and any future account
// that needs a visit/appointment row.
export function VisitRowCard({
  dateISO,
  title,
  subtitle,
  badge,
  accent = "#1e3a8a",
  accentBg = "#eef2ff",
  chevron = false,
  onPress,
}: {
  dateISO: string;
  title: string;
  subtitle: string;
  badge: VisitRowBadge;
  // Date-badge text colour + background tint (nurse/family/coordinator theme).
  accent?: string;
  accentBg?: string;
  chevron?: boolean;
  onPress?: () => void;
}) {
  const date = new Date(dateISO);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card rounded-2xl p-3 mb-3"
      style={{
        borderWidth: 1,
        borderColor: "#ebedf0",
        shadowColor: "#0f172a",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* Date badge */}
      <View
        className="rounded-xl items-center justify-center"
        style={{ width: 48, height: 48, backgroundColor: accentBg }}
      >
        <Text style={{ color: accent, fontSize: 16, fontWeight: "700" }}>
          {date.getDate()}
        </Text>
        <Text style={{ color: accent, fontSize: 9, fontWeight: "600" }}>
          {MONTHS[date.getMonth()]}
        </Text>
      </View>

      <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
        <Text
          className="text-foreground font-bold"
          style={{ fontSize: 14 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="text-muted"
          style={{ fontSize: 12, marginTop: 2 }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      <View
        className="flex-row items-center rounded-full px-2.5 py-1"
        style={{ backgroundColor: badge.bg }}
      >
        {badge.dot && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: badge.color,
              marginRight: 5,
            }}
          />
        )}
        <Text
          style={{ color: badge.color, fontSize: 11, fontWeight: badge.dot ? "700" : "600" }}
        >
          {badge.label}
        </Text>
      </View>

      {chevron && (
        <Ionicons
          name="chevron-forward"
          size={15}
          color="#c4c9d1"
          style={{ marginLeft: 4 }}
        />
      )}
    </Pressable>
  );
}
