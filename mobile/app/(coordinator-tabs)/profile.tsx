import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinatorCases, useCoordinatorLogs } from "@/hooks/useCoordinator";
import { useAuthProfile } from "@/hooks/useProfile";
import { initialsOf } from "@/lib/avatar";
import { rateApp } from "@/lib/rate";

const TEAL = "#0d9488";

type RowItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
};

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold px-5"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function Row({ item, showDivider }: { item: RowItem; showDivider: boolean }) {
  return (
    <View>
      <Pressable
        onPress={item.onPress}
        className="flex-row items-center px-4"
        style={{ paddingVertical: 14 }}
      >
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: item.bg }}
        >
          <Ionicons name={item.icon} size={18} color={item.tint} />
        </View>
        <View className="flex-1 ml-3">
          <Text
            className="font-semibold"
            style={{ fontSize: 14.5, color: item.danger ? "#dc2626" : "#111827" }}
          >
            {item.title}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {item.subtitle}
          </Text>
        </View>
        {item.value && (
          <Text className="text-muted mr-1" style={{ fontSize: 13 }}>
            {item.value}
          </Text>
        )}
        {!item.danger && (
          <Ionicons name="chevron-forward" size={16} color="#c4c9d1" />
        )}
      </Pressable>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: "#f3f4f6", marginLeft: 64 }} />
      )}
    </View>
  );
}

function Section({ items }: { items: RowItem[] }) {
  return (
    <View className="mx-5">
      <View
        className="bg-card rounded-2xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
      >
        {items.map((item, i) => (
          <Row key={item.key} item={item} showDivider={i < items.length - 1} />
        ))}
      </View>
    </View>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-foreground font-bold" style={{ fontSize: 20 }}>
        {value}
      </Text>
      <Text className="text-muted text-center" style={{ fontSize: 11, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function CoordinatorProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: profile } = useAuthProfile();
  const { data: cases } = useCoordinatorCases();
  const { data: logs } = useCoordinatorLogs();

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.firstName || user?.email?.split("@")[0] || "Coordinator";
  const initials = initialsOf(fullName || "Coordinator");

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const list = cases ?? [];
  const activeCases = list.filter((c) => c.status === "ACTIVE").length;
  const totalCases = list.length;
  const logsReviewed = (logs ?? []).filter((l) => l.reviewedAt).length;

  async function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/sign-in" as any);
        },
      },
    ]);
  }

  const account: RowItem[] = [
    {
      key: "personal",
      icon: "person-outline",
      tint: TEAL,
      bg: "#ccfbf1",
      title: "Personal information",
      subtitle: "Name, phone, email",
      onPress: () => router.push("/account-details" as any),
    },
  ];

  const work: RowItem[] = [
    {
      key: "cases",
      icon: "people-outline",
      tint: TEAL,
      bg: "#ccfbf1",
      title: "My cases",
      subtitle: "Families you're coordinating",
      value: totalCases ? String(totalCases) : undefined,
      onPress: () => router.push("/(coordinator-tabs)/cases" as any),
    },
    {
      key: "logs",
      icon: "document-text-outline",
      tint: "#7c3aed",
      bg: "#f5f3ff",
      title: "Daily logs",
      subtitle: "Review nurse visit reports",
      onPress: () => router.push("/(coordinator-tabs)/logs" as any),
    },
  ];

  const preferences: RowItem[] = [
    {
      key: "notifications",
      icon: "notifications-outline",
      tint: "#d97706",
      bg: "#fffbeb",
      title: "Notifications",
      subtitle: "Push and SMS alerts",
      onPress: () => router.push("/notification-settings" as any),
    },
    {
      key: "language",
      icon: "language-outline",
      tint: "#6b7280",
      bg: "#f3f4f6",
      title: "Language",
      subtitle: "App display language",
      value: "English",
      onPress: () => router.push("/language" as any),
    },
    {
      key: "accessibility",
      icon: "accessibility-outline",
      tint: "#2563eb",
      bg: "#eff6ff",
      title: "Accessibility",
      subtitle: "Text size, contrast, screen reader",
      onPress: () => router.push("/accessibility" as any),
    },
  ];

  const support: RowItem[] = [
    {
      key: "help",
      icon: "help-circle-outline",
      tint: "#16a34a",
      bg: "#f0fdf4",
      title: "Help centre",
      subtitle: "FAQs and how-to guides",
      onPress: () => router.push("/help-centre" as any),
    },
    {
      key: "contact",
      icon: "chatbubble-ellipses-outline",
      tint: "#4f46e5",
      bg: "#eef2ff",
      title: "Contact support",
      subtitle: "Chat, call or email us",
      onPress: () => router.push("/contact-support" as any),
    },
    {
      key: "rate",
      icon: "star-outline",
      tint: "#f59e0b",
      bg: "#fffbeb",
      title: "Rate the app",
      subtitle: "Share your feedback on the store",
      onPress: () => rateApp(),
    },
  ];

  const actions: RowItem[] = [
    {
      key: "logout",
      icon: "log-out-outline",
      tint: "#dc2626",
      bg: "#fef2f2",
      title: "Log out",
      subtitle: "Sign out of your account",
      danger: true,
      onPress: handleLogout,
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — content scrolls beneath it */}
      <View
        className="px-5 pb-3 bg-background"
        style={{ paddingTop: top + 8 }}
      >
        <Text className="text-foreground font-bold" style={{ fontSize: 24 }}>
          My Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View className="mx-5">
          <View
            className="bg-card rounded-3xl items-center px-5 pt-6 pb-5"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 26 }}>
                {initials}
              </Text>
            </View>

            <Text
              className="text-foreground font-bold"
              style={{ fontSize: 20, marginTop: 12 }}
            >
              {fullName}
            </Text>
            <View
              className="flex-row items-center rounded-full px-3 py-1 mt-2"
              style={{ backgroundColor: "#ccfbf1" }}
            >
              <Ionicons name="shield-checkmark" size={13} color={TEAL} />
              <Text
                style={{ color: "#0f766e", fontSize: 12, fontWeight: "700", marginLeft: 4 }}
              >
                Care Coordinator
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/account-details" as any)}
              className="rounded-full px-4 py-1.5 mt-3"
              style={{ backgroundColor: "#ccfbf1" }}
            >
              <Text style={{ color: "#0f766e", fontSize: 13, fontWeight: "600" }}>
                Edit profile
              </Text>
            </Pressable>

            {/* Stats */}
            <View
              className="flex-row w-full mt-5 pt-5"
              style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
            >
              <StatItem value={String(activeCases)} label="Active cases" />
              <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
              <StatItem value={String(totalCases)} label="Cases coordinated" />
              <View style={{ width: 1, backgroundColor: "#f3f4f6" }} />
              <StatItem value={memberSince} label="Coordinating since" />
            </View>
          </View>
        </View>

        {/* Sections */}
        <SectionLabel title="Account" />
        <Section items={account} />

        <SectionLabel title="Coordination" />
        <Section items={work} />

        <SectionLabel title="Preferences" />
        <Section items={preferences} />

        <SectionLabel title="Support" />
        <Section items={support} />

        <SectionLabel title="Account actions" />
        <Section items={actions} />

        {logsReviewed > 0 && (
          <Text
            className="text-muted text-center"
            style={{ fontSize: 12, marginTop: 18 }}
          >
            {logsReviewed} visit {logsReviewed === 1 ? "log" : "logs"} reviewed
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
