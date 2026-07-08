import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import type { ApiAssignment } from "@/services/assignment.service";

function Fact({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Ionicons name={icon} size={13} color="#6b7280" />
        <Text className="text-muted" style={{ fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3 }}>
          {label}
        </Text>
      </View>
      <Text className="text-foreground font-bold" style={{ fontSize: 14.5, marginTop: 3 }}>
        {value}
      </Text>
    </View>
  );
}

export function AssignmentClientCard({
  assignment,
}: {
  assignment: ApiAssignment;
}) {
  const { client, family } = assignment;
  const genderLabel = client.gender === "MALE" ? "Male" : "Female";

  return (
    <View
      className="bg-card rounded-2xl p-5"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {/* Family header */}
      <View className="flex-row items-center">
        <Avatar
          name={client.name}
          initials={client.initials}
          photoUrl={family.photoUrl}
          size={60}
        />
        <View className="flex-1" style={{ marginLeft: 14 }}>
          <View className="flex-row items-center" style={{ gap: 5 }}>
            <Ionicons name="people" size={13} color="#2563eb" />
            <Text className="text-muted" style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
              FAMILY
            </Text>
          </View>
          <Text className="text-foreground font-bold" style={{ fontSize: 18, marginTop: 2 }}>
            {client.name}
          </Text>
          <View className="flex-row items-center" style={{ marginTop: 2, gap: 4 }}>
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-muted" style={{ fontSize: 12.5 }}>
              {client.area}, {client.city}
            </Text>
          </View>
        </View>
      </View>

      {/* Gender + age captured for the care recipient */}
      <View
        className="flex-row items-center rounded-2xl p-3.5 mt-4"
        style={{ backgroundColor: "#f8fafc", gap: 10 }}
      >
        <Fact icon="male-female-outline" label="GENDER" value={genderLabel} />
        <View style={{ width: 1, height: 30, backgroundColor: "#e5e7eb" }} />
        <Fact icon="calendar-outline" label="AGE" value={`${client.age} yrs`} />
      </View>

      {/* Conditions */}
      {client.conditions.length > 0 && (
        <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
          {client.conditions.map((c) => (
            <View
              key={c}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Text style={{ color: "#374151", fontSize: 12, fontWeight: "500" }}>
                {c}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Care coordinator */}
      <View
        className="flex-row items-center mt-4 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="shield-checkmark" size={19} color="#2563eb" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-muted" style={{ fontSize: 11, fontWeight: "600" }}>
            Care Coordinator
          </Text>
          <Text
            className="text-foreground"
            style={{ fontSize: 15.5, fontWeight: "800", marginTop: 1 }}
          >
            {assignment.coordinatorName ?? "To be assigned"}
          </Text>
        </View>
      </View>
    </View>
  );
}
