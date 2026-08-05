import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import type { ApiVerificationStatus } from "@/services/caregiver.service";

const NAVY = "#0f2c4d";

// Actionable things a nurse can do while their documents are under review —
// each links to the relevant screen.
const WHILE_YOU_WAIT: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  {
    label: "Set up your payment method so you get paid on time",
    icon: "card-outline",
    route: "/caregiver-payment-method",
  },
  {
    label: "Read the caregiver code of conduct",
    icon: "shield-checkmark-outline",
    route: "/caregiver-code-of-conduct",
  },
  {
    label: "Turn on notifications so you never miss a case offer",
    icon: "notifications-outline",
    route: "/notification-settings",
  },
];

type StepState = "done" | "active" | "pending";
type Step = {
  title: string;
  subtitle: string;
  state: StepState;
};

function buildSteps(status: ApiVerificationStatus): Step[] {
  const verified = status === "VERIFIED";
  const rejected = status === "REJECTED";
  const reviewing = status === "PENDING_REVIEW";

  return [
    {
      title: "Documents submitted",
      subtitle: rejected
        ? "Received — see notes on your credentials"
        : "We've received your Ghana Card and PIN card",
      state: status === "UNVERIFIED" ? "active" : "done",
    },
    {
      title: "Identity verification",
      subtitle: verified
        ? "Completed"
        : reviewing
          ? "In progress · Est. 1–2 business days"
          : rejected
            ? "Needs attention"
            : "Waiting on your documents",
      state: verified ? "done" : reviewing || rejected ? "active" : "pending",
    },
    {
      title: "Credential review",
      subtitle: verified ? "Completed" : "Waiting on identity check",
      state: verified ? "done" : "pending",
    },
    {
      title: "Account approved",
      subtitle: verified
        ? "You're verified — you can receive cases"
        : "You'll be notified via SMS & email",
      state: verified ? "done" : "pending",
    },
  ];
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 28, height: 28, backgroundColor: "#16a34a" }}
      >
        <Ionicons name="checkmark" size={16} color="#ffffff" />
      </View>
    );
  }
  if (state === "active") {
    return (
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 28, height: 28, borderWidth: 3, borderColor: "#f59e0b" }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b" }} />
      </View>
    );
  }
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: 28, height: 28, backgroundColor: "#e5e7eb" }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#9ca3af" }} />
    </View>
  );
}

export default function ApplicationSubmittedScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { data: profile } = useCaregiverProfile();

  const status = profile?.verificationStatus ?? "PENDING_REVIEW";
  const verified = status === "VERIFIED";
  const steps = buildSteps(status);

  function goToDashboard() {
    router.replace("/(caregiver-tabs)" as any);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: NAVY }}>
      <StatusBar style="light" />

      {/* Hero */}
      <View style={{ paddingTop: top + 24, paddingHorizontal: 24, paddingBottom: 28 }}>
        <View className="items-center">
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              backgroundColor: "rgba(22,163,74,0.25)",
              borderWidth: 2,
              borderColor: "#16a34a",
            }}
          >
            <Ionicons
              name={verified ? "checkmark-done" : "time-outline"}
              size={32}
              color="#4ade80"
            />
          </View>
          <Text
            className="text-white font-bold text-center"
            style={{ fontSize: 24, marginTop: 16 }}
          >
            {verified ? "You're verified!" : "Application submitted!"}
          </Text>
          <Text
            className="text-center"
            style={{ color: "#cbd5e1", fontSize: 14, marginTop: 8, lineHeight: 20 }}
          >
            {verified
              ? "Your account is approved. You can now receive and accept case offers."
              : "We've received your documents and will review your application within 1–2 business days."}
          </Text>
        </View>
      </View>

      {/* Sheet */}
      <View
        className="flex-1 bg-background"
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: bottom + 120 }}
        >
          <Text
            className="text-muted font-semibold"
            style={{ fontSize: 11, letterSpacing: 1, marginBottom: 16 }}
          >
            VERIFICATION STEPS
          </Text>

          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            return (
              <View key={step.title} className="flex-row">
                {/* Rail */}
                <View className="items-center" style={{ width: 28 }}>
                  <StepDot state={step.state} />
                  {!last && (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 26,
                        backgroundColor:
                          step.state === "done" ? "#16a34a" : "#e5e7eb",
                        marginVertical: 2,
                      }}
                    />
                  )}
                </View>
                {/* Text */}
                <View className="flex-1 ml-3" style={{ paddingBottom: last ? 0 : 14 }}>
                  <Text
                    className="font-bold"
                    style={{
                      fontSize: 15,
                      color: step.state === "pending" ? "#9ca3af" : "#111827",
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      marginTop: 2,
                      color:
                        step.state === "active"
                          ? "#d97706"
                          : step.state === "pending"
                            ? "#9ca3af"
                            : "#6b7280",
                    }}
                  >
                    {step.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* While you wait — actionable, each links to the relevant screen */}
          {!verified && (
            <View style={{ marginTop: 26 }}>
              <Text
                className="text-muted font-semibold"
                style={{ fontSize: 11, letterSpacing: 1, marginBottom: 12 }}
              >
                WHILE YOU WAIT
              </Text>
              {WHILE_YOU_WAIT.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  className="flex-row items-center rounded-2xl p-4"
                  style={{ backgroundColor: "#eff6ff", marginBottom: 10 }}
                >
                  <View
                    className="items-center justify-center rounded-xl"
                    style={{ width: 38, height: 38, backgroundColor: "#dbeafe" }}
                  >
                    <Ionicons name={item.icon} size={19} color="#2563eb" />
                  </View>
                  <Text
                    className="flex-1"
                    style={{ color: "#1e40af", fontSize: 13.5, fontWeight: "600", marginLeft: 12, lineHeight: 19 }}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#93c5fd" />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 bg-background px-6 pt-3"
          style={{
            paddingBottom: bottom + 12,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
          }}
        >
          <Pressable
            onPress={goToDashboard}
            className="rounded-2xl items-center justify-center py-4"
            style={{ borderWidth: 1.5, borderColor: "#1e3a8a" }}
          >
            <Text style={{ color: "#1e3a8a", fontSize: 15, fontWeight: "700" }}>
              Go to dashboard
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
