import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { VisitDetail } from "@/constants/visit-details";

function DetailRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-3"
      style={
        isLast ? undefined : { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }
      }
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: "#eff6ff" }}
      >
        <Ionicons name={icon} size={16} color="#2563eb" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-muted" style={{ fontSize: 12 }}>
          {label}
        </Text>
        <Text
          className="text-foreground font-semibold"
          style={{ fontSize: 14, marginTop: 1 }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function VisitDetailsCard({ visit }: { visit: VisitDetail }) {
  return (
    <View
      className="bg-card rounded-2xl px-4 py-2"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <DetailRow icon="medkit-outline" label="Service" value={visit.service} />
      <DetailRow icon="calendar-outline" label="Date" value={visit.dateLong} />
      <DetailRow
        icon="time-outline"
        label="Time"
        value={`${visit.time} · ${visit.durationHrs} hours`}
      />
      <DetailRow
        icon="location-outline"
        label="Address"
        value={visit.address}
        isLast
      />

      {/* Map placeholder — swap for react-native-maps when location data is live */}
      <View
        className="rounded-xl items-center justify-center mb-3"
        style={{ height: 110, backgroundColor: "#f3f4f6" }}
      >
        <Ionicons name="location" size={26} color="#dc2626" />
      </View>
    </View>
  );
}
