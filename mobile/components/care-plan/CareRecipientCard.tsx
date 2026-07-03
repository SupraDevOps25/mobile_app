import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { initialsOf } from "@/lib/avatar";
import type { ApiCareRecipient } from "@/services/subscription.service";

export function CareRecipientCard({ client }: { client: ApiCareRecipient }) {
  const genderLabel = client.gender === "MALE" ? "Male" : "Female";
  return (
    <View
      className="bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#4f46e5" }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {initialsOf(client.name)}
          </Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
            {client.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {client.age} yrs · {genderLabel} ·{" "}
            {client.bookingFor === "SELF"
              ? "Yourself"
              : `Your ${client.relationToAccount.toLowerCase()}`}
          </Text>
        </View>
      </View>

      {/* Conditions */}
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

      {/* Address */}
      <View className="flex-row items-center mt-3">
        <Ionicons name="location-outline" size={15} color="#6b7280" />
        <Text className="text-muted" style={{ fontSize: 13, marginLeft: 6 }}>
          {client.address}
        </Text>
      </View>
    </View>
  );
}
