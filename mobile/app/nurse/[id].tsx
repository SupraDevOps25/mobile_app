import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CARE_TEAM_ROLE_LABELS, getTeamNurse } from "@/constants/care";
import { getCompetencyLabel } from "@/constants/competencies";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 12 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function NurseProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const member = getTeamNurse(id);

  if (!member) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Nurse not found.</Text>
      </View>
    );
  }

  const { nurse, role } = member;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Nurse profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        {/* Hero */}
        <View className="items-center" style={{ marginTop: 8 }}>
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: nurse.avatarColor }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 24 }}>
              {nurse.initials}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ marginTop: 12 }}>
            <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
              {nurse.name}
            </Text>
            {nurse.licenseVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2563eb" style={{ marginLeft: 5 }} />
            )}
          </View>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {nurse.qualification}
          </Text>
          <View
            className="rounded-full px-3 py-1 mt-3"
            style={{ backgroundColor: role === "assigned" ? "#dcfce7" : "#f3f4f6" }}
          >
            <Text
              style={{
                color: role === "assigned" ? "#16a34a" : "#6b7280",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {CARE_TEAM_ROLE_LABELS[role]}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View
          className="flex-row bg-card rounded-2xl py-4 mt-6"
          style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
        >
          <Stat value={`${nurse.yearsExperience} yrs`} label="Experience" />
          <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
          <Stat value={`★ ${nurse.rating}`} label="Rating" />
          <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
          <Stat value={`${nurse.reliabilityScore}%`} label="Reliability" />
        </View>

        {/* Competencies */}
        <SectionLabel title="Clinical competencies" />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {nurse.competencies.map((c) => (
            <View
              key={c}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "500" }}>
                {getCompetencyLabel(c)}
              </Text>
            </View>
          ))}
        </View>

        {/* Service areas */}
        <SectionLabel title="Service areas" />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {nurse.serviceAreas.map((area) => (
            <View
              key={area}
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Ionicons name="location-outline" size={13} color="#6b7280" />
              <Text style={{ color: "#374151", fontSize: 12, marginLeft: 4 }}>
                {area}
              </Text>
            </View>
          ))}
        </View>

        {/* Communication note — families coordinate through the Coordinator */}
        <View
          className="flex-row rounded-2xl p-4 mt-6"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
          <Text
            style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
          >
            All scheduling and communication is handled by your Care Coordinator to
            ensure continuity and quality of care.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
