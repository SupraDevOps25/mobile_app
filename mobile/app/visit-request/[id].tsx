import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EarningsCard } from "@/components/visit-request/EarningsCard";
import { PatientHeaderCard } from "@/components/visit-request/PatientHeaderCard";
import { VisitDetailsCard } from "@/components/visit-request/VisitDetailsCard";
import { getVisitDetail } from "@/constants/visit-details";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold mb-2"
      style={{ fontSize: 11, letterSpacing: 1 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function VisitRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const visit = getVisitDetail(id);

  if (!visit) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Visit request not found.</Text>
      </View>
    );
  }

  function handleAccept() {
    Alert.alert(
      "Accept visit",
      `Accept the visit for ${visit!.patientName} on ${visit!.dateLong}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            Alert.alert(
              "Visit accepted",
              "The visit has been added to your schedule. The family will be notified.",
              [{ text: "OK", onPress: () => router.back() }],
            );
          },
        },
      ],
    );
  }

  function handleDecline() {
    Alert.alert(
      "Decline visit",
      "Are you sure? This request will be offered to another caregiver.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 bg-white"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-foreground font-bold" style={{ fontSize: 18 }}>
          Visit request
        </Text>
        <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}>
          New
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        <PatientHeaderCard visit={visit} />

        <View className="mt-5">
          <SectionLabel title="Visit details" />
          <VisitDetailsCard visit={visit} />
        </View>

        <View className="mt-5">
          <SectionLabel title="Notes from patient" />
          <View
            className="bg-card rounded-2xl p-4"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21 }}>
              {visit.patientNotes}
            </Text>
          </View>
        </View>

        <View className="mt-5">
          <EarningsCard visit={visit} />
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        className="flex-row bg-white px-5 pt-3"
        style={{
          paddingBottom: bottom + 12,
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={handleDecline}
          className="rounded-full items-center justify-center px-6 py-4"
          style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
        >
          <Text className="text-muted font-semibold" style={{ fontSize: 15 }}>
            Decline
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAccept}
          className="flex-1 rounded-full items-center justify-center py-4"
          style={{ backgroundColor: "#16a34a" }}
        >
          <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
            Accept visit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
