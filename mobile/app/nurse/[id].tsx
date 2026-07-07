import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ASSIGNMENT_ROLE_LABELS } from "@/constants/subscription-presentation";
import {
  useActiveSubscription,
  usePastCareDetail,
} from "@/hooks/useSubscription";
import { avatarColor } from "@/lib/avatar";

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
  // `sub` is set when opening a nurse from a past (ended) engagement, so we can
  // look them up in that engagement's team rather than the active plan.
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: subscription, isLoading } = useActiveSubscription();
  const { data: pastDetail, isLoading: pastLoading } = usePastCareDetail(sub);
  const nurse =
    subscription?.careTeam.nurses.find((n) => n.assignmentId === id) ??
    pastDetail?.careTeam.nurses.find((n) => n.assignmentId === id);
  const isLead = nurse?.role === "PRIMARY";

  if (isLoading || (!!sub && pastLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  if (!nurse) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Nurse not found.</Text>
      </View>
    );
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
          Nurse profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        {/* Hero */}
        <View className="items-center" style={{ marginTop: 8 }}>
          {nurse.photoUrl ? (
            <Image
              source={{ uri: nurse.photoUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(nurse.name) }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 24 }}>
                {nurse.initials}
              </Text>
            </View>
          )}
          <View className="flex-row items-center" style={{ marginTop: 12 }}>
            <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
              {nurse.name}
            </Text>
            {nurse.licenseVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#2563eb" style={{ marginLeft: 5 }} />
            )}
          </View>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {nurse.qualification ?? "Nurse"}
          </Text>
          <View
            className="rounded-full px-3 py-1 mt-3"
            style={{ backgroundColor: isLead ? "#dcfce7" : "#f3f4f6" }}
          >
            <Text
              style={{
                color: isLead ? "#16a34a" : "#6b7280",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {ASSIGNMENT_ROLE_LABELS[nurse.role]}
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
          <Stat
            value={`★ ${nurse.rating.toFixed(1)}`}
            label={
              nurse.totalReviews > 0
                ? `${nurse.totalReviews} ${nurse.totalReviews === 1 ? "review" : "reviews"}`
                : "Rating"
            }
          />
          <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
          <Stat value={`${nurse.reliabilityScore}%`} label="Reliability " />
        </View>

        {/* About the nurse */}
        {nurse.bio && nurse.bio.trim().length > 0 && (
          <>
            <SectionLabel title="About" />
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <Text className="text-foreground" style={{ fontSize: 13.5, lineHeight: 20 }}>
                {nurse.bio}
              </Text>
            </View>
          </>
        )}

        {/* Languages spoken — matters for comfort and communication */}
        {nurse.languages.length > 0 && (
          <>
            <SectionLabel title="Speaks" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {nurse.languages.map((lang) => (
                <View
                  key={lang}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: "#f3f4f6" }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#6b7280" />
                  <Text style={{ color: "#374151", fontSize: 12, marginLeft: 4 }}>
                    {lang}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Good to know — gender, homecare experience, verification */}
        {(nurse.gender || nurse.hasHomecareExp || nurse.licenseVerified) && (
          <>
            <SectionLabel title="Good to know" />
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {nurse.gender && (
            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons
                name={nurse.gender === "FEMALE" ? "female-outline" : "male-outline"}
                size={13}
                color="#2563eb"
              />
              <Text style={{ color: "#1d4ed8", fontSize: 12, marginLeft: 4, fontWeight: "500" }}>
                {nurse.gender === "FEMALE" ? "Female" : "Male"}
              </Text>
            </View>
          )}
          {nurse.hasHomecareExp && (
            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <Ionicons name="home-outline" size={13} color="#16a34a" />
              <Text style={{ color: "#15803d", fontSize: 12, marginLeft: 4, fontWeight: "500" }}>
                Homecare experienced
              </Text>
            </View>
          )}
          {nurse.licenseVerified && (
            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons name="shield-checkmark-outline" size={13} color="#2563eb" />
              <Text style={{ color: "#1d4ed8", fontSize: 12, marginLeft: 4, fontWeight: "500" }}>
                Licence verified
              </Text>
            </View>
          )}
            </View>
          </>
        )}

        {/* Service areas (proximity) */}
        {nurse.serviceAreas.length > 0 && (
          <>
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
          </>
        )}

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
