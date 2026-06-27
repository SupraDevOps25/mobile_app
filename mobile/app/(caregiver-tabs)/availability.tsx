import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCaregiverProfile,
  useSetAvailability,
} from "@/hooks/useCaregiverProfile";

function Stat({ label, value }: { label: string; value: string }) {
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

export default function AvailabilityScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, isLoading } = useCaregiverProfile();
  const setAvailability = useSetAvailability();

  const available = profile?.isAvailable ?? false;

  function onToggle(next: boolean) {
    setAvailability.mutate(next, {
      onError: (err: Error) => Alert.alert("Couldn't update", err.message),
    });
  }

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
          Availability
        </Text>
      </View>

      {isLoading || !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          {/* Availability toggle */}
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: available ? "#0f2461" : "#1f2937",
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white font-bold" style={{ fontSize: 17 }}>
                  {available ? "You're available" : "You're unavailable"}
                </Text>
                <Text style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                  {available
                    ? "You can be matched to new care cases."
                    : "You won't be offered new cases until you turn this on."}
                </Text>
              </View>
              <Switch
                value={available}
                onValueChange={onToggle}
                disabled={setAvailability.isPending}
                trackColor={{ false: "#4b5563", true: "#16a34a" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Profile stats */}
          <View
            className="flex-row bg-card rounded-2xl py-4 mt-5"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <Stat label="Experience" value={`${profile.yearsExperience} yrs`} />
            <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
            <Stat label="Rating" value={`★ ${profile.rating.toFixed(1)}`} />
            <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
            <Stat label="Reliability" value={`${profile.reliabilityScore}%`} />
          </View>

          {/* Service areas */}
          {profile.serviceAreas.length > 0 && (
            <>
              <Text
                className="text-muted font-semibold"
                style={{ fontSize: 11, letterSpacing: 1, marginTop: 24, marginBottom: 12 }}
              >
                YOUR SERVICE AREAS
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {profile.serviceAreas.map((area) => (
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
            </>
          )}

          <View
            className="flex-row rounded-2xl p-4 mt-6"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
            <Text
              style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
            >
              We match nurses by availability, experience, proximity, reliability and
              continuity with the family. Keep this up to date so you only get cases
              you can take.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
