import { Text, View } from "react-native";
import type { VisitDetail } from "@/constants/visit-details";

type Props = {
  visit: VisitDetail;
};

export function PatientHeaderCard({ visit }: Props) {
  return (
    <View
      className="bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: visit.avatarColor }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {visit.initials}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 17 }}>
            {visit.patientName}
          </Text>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {visit.age} yrs · {visit.gender} · {visit.area}, {visit.city}
          </Text>
        </View>
      </View>

      {/* Condition tags */}
      <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
        {visit.conditions.map((c) => (
          <View
            key={c.label}
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: c.bg }}
          >
            <Text style={{ color: c.color, fontSize: 12, fontWeight: "600" }}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
