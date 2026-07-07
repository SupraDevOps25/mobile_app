import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

// Palette taken from the Figma "Set availability" design.
const GREEN = "#16a34a";
const GREEN_LIGHT = "#f0fdf4";
const GREEN_CHIP_TEXT = "#15803d";
const SCREEN_BG = "#f3f4f6";
const CARD_BORDER = "#eef2f6";
const RED = "#ef4444";
const LABEL = "#9ca3af";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: LABEL,
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: "600",
        marginBottom: 10,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: 16,
        marginBottom: 14,
      }}
    >
      {children}
    </View>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View
        className="rounded-full items-center justify-center mb-1.5"
        style={{ width: 34, height: 34, backgroundColor: `${color}1a` }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text style={{ color: LABEL, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function AvailabilityScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, isLoading } = useCaregiverProfile();
  const setAvailability = useSetAvailability();

  const [available, setAvailable] = useState(false);

  // Sync local state once the profile loads.
  useEffect(() => {
    if (profile) setAvailable(profile.isAvailable);
  }, [profile]);

  const dirty = profile ? available !== profile.isAvailable : false;

  function handleSave() {
    setAvailability.mutate(available, {
      onSuccess: () => {
        Alert.alert(
          "Availability updated",
          available
            ? "You're now available for new cases."
            : "You won't be offered new cases until you turn this back on.",
        );
      },
      onError: (err: Error) => Alert.alert("Couldn't update", err.message),
    });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: SCREEN_BG }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-3"
        style={{ paddingTop: top + 8, backgroundColor: SCREEN_BG }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.push("/profile" as any)}
            hitSlop={12}
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: "#ffffff" }}
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
            Set availability
          </Text>
        </View>
        {dirty && (
          <Pressable
            onPress={() => profile && setAvailable(profile.isAvailable)}
            hitSlop={8}
          >
            <Text style={{ color: RED, fontSize: 14, fontWeight: "600" }}>
              Reset
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading || !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={GREEN} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 6 }}
          >
            {/* Availability toggle */}
            <SectionLabel title="Availability" />
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                    Available for new cases
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                    Turn this off when you can&apos;t take on new families.
                  </Text>
                </View>
                <Switch
                  value={available}
                  onValueChange={setAvailable}
                  trackColor={{ false: "#d1d5db", true: GREEN }}
                  thumbColor="#ffffff"
                />
              </View>

              {available && (
                <View
                  className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
                  style={{ backgroundColor: GREEN_LIGHT }}
                >
                  <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                  <Text style={{ color: GREEN_CHIP_TEXT, fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                    You can be matched to new care cases
                  </Text>
                </View>
              )}
            </Card>

            {/* Standing / match factors */}
            <SectionLabel title="Your standing" />
            <Card>
              <View className="flex-row">
                <Stat
                  label="Experience"
                  value={`${profile.yearsExperience} yrs`}
                  icon="briefcase-outline"
                  color="#2563eb"
                />
                <View style={{ width: 1, backgroundColor: CARD_BORDER }} />
                <Stat
                  label="Ratings "
                  value={profile.rating.toFixed(1)}
                  icon="star"
                  color="#f59e0b"
                />
                <View style={{ width: 1, backgroundColor: CARD_BORDER }} />
                <Stat
                  label="Reliability "
                  value={`${profile.reliabilityScore}%`}
                  icon="shield-checkmark-outline"
                  color="#16a34a"
                />
              </View>
            </Card>

            {/* Service areas (proximity) */}
            {profile.serviceAreas.length > 0 && (
              <>
                <SectionLabel title="Service areas" />
                <Card>
                  <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
                    Families near these areas are matched to you first.
                  </Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {profile.serviceAreas.map((area) => (
                      <View
                        key={area}
                        className="flex-row items-center rounded-full px-3 py-1.5"
                        style={{ backgroundColor: GREEN_LIGHT }}
                      >
                        <Ionicons name="location" size={13} color={GREEN} />
                        <Text style={{ color: GREEN_CHIP_TEXT, fontSize: 12, fontWeight: "500", marginLeft: 4 }}>
                          {area}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </>
            )}

            {/* Info note */}
            <View
              className="flex-row rounded-2xl p-4 mt-1"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
              <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
                We match nurses by availability, experience, proximity, reliability and
                continuity with the family. Changes take effect once you save.
              </Text>
            </View>
          </ScrollView>

          {/* Sticky footer */}
          <View
            className="px-4 pt-3"
            style={{ paddingBottom: bottom + 12, backgroundColor: SCREEN_BG }}
          >
            <Pressable
              onPress={handleSave}
              disabled={!dirty || setAvailability.isPending}
              className="rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: !dirty ? "#9ca3af" : GREEN,
                paddingVertical: 16,
                gap: 8,
              }}
            >
              {setAvailability.isPending && (
                <ActivityIndicator color="#ffffff" size="small" />
              )}
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                Save availability
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
