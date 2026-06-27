import { Text, View } from "react-native";
import { avatarColor } from "@/lib/avatar";
import type { ApiAssignment } from "@/services/assignment.service";

export function AssignmentClientCard({
  assignment,
}: {
  assignment: ApiAssignment;
}) {
  const { client } = assignment;
  const genderLabel = client.gender === "MALE" ? "Male" : "Female";

  return (
    <View
      className="bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor(client.name) }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {client.initials}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
            {client.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {client.age} yrs · {genderLabel} · {client.area}, {client.city}
          </Text>
        </View>
      </View>

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
    </View>
  );
}
