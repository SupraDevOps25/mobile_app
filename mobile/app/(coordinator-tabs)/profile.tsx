import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useCoordinatorCases, useCoordinatorLogs } from "@/hooks/useCoordinator";
import { useAuthProfile, useUploadAuthPhoto } from "@/hooks/useProfile";
import { useRefresh } from "@/hooks/useRefresh";
import { initialsOf } from "@/lib/avatar";
import { pickImageFromLibrary, takePhoto } from "@/lib/pick";
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
        <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
          <Text
            className="font-semibold"
            style={{ fontSize: 14.5, color: item.danger ? "#dc2626" : "#111827" }}
          >
            {item.title}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1, flexShrink: 1 }}>
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
    <View
      className="mx-5"
      style={{
        borderRadius: 16,
        backgroundColor: "#ffffff",
        shadowColor: "#0f172a",
        shadowOpacity: 0.03,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <View
        className="bg-card rounded-2xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "#ebedf0" }}
      >
        {items.map((item, i) => (
          <Row key={item.key} item={item} showDivider={i < items.length - 1} />
        ))}
      </View>
    </View>
  );
}

function StatItem({
  icon,
  tint,
  bg,
  border,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  border: string;
  value: string;
  label: string;
}) {
  return (
    <View
      className="flex-1 items-center"
      style={{
        backgroundColor: bg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: 12,
        paddingHorizontal: 6,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.7)",
        }}
      >
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text
        style={{ color: tint, fontSize: 16, fontWeight: "800", marginTop: 7 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={{
          color: tint,
          fontSize: 10,
          fontWeight: "700",
          opacity: 0.85,
          marginTop: 2,
          textAlign: "center",
          lineHeight: 13,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

export default function CoordinatorProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: profile, refetch: refetchProfile } = useAuthProfile();
  const { data: cases, refetch: refetchCases } = useCoordinatorCases();
  const { data: logs, refetch: refetchLogs } = useCoordinatorLogs();
  const uploadPhoto = useUploadAuthPhoto();
  const { refreshing, onRefresh } = useRefresh([
    refetchProfile,
    refetchCases,
    refetchLogs,
  ]);

  const photoUrl = profile?.photoUrl ?? null;

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

  function changePhoto() {
    Alert.alert("Profile photo", "Choose a source", [
      {
        text: "Take photo",
        onPress: async () => {
          const file = await takePhoto();
          if (file)
            uploadPhoto.mutate(file, {
              onError: (e: Error) => Alert.alert("Upload failed", e.message),
            });
        },
      },
      {
        text: "Choose from library",
        onPress: async () => {
          const file = await pickImageFromLibrary();
          if (file)
            uploadPhoto.mutate(file, {
              onError: (e: Error) => Alert.alert("Upload failed", e.message),
            });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

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
      subtitle: "Photo, contact, experience, about",
      onPress: () => router.push("/coordinator-personal-information" as any),
    },
  ];

  const work: RowItem[] = [
    {
      key: "earnings",
      icon: "wallet-outline",
      tint: "#0f766e",
      bg: "#ccfbf1",
      title: "Earnings & payouts",
      subtitle: "Your 8% fee per case, and withdrawals",
      onPress: () => router.push("/coordinator-earnings" as any),
    },
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

  const security: RowItem[] = [
    {
      key: "password",
      icon: "lock-closed-outline",
      tint: "#dc2626",
      bg: "#fef2f2",
      title: "Change password",
      subtitle: "Update your account password",
      onPress: () => router.push("/change-password" as any),
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
            colors={["#0d9488"]}
          />
        }
      >
        {/* Profile card */}
        <View className="mx-5">
          <View
            className="bg-card rounded-3xl items-center px-5 pt-6 pb-5"
            style={{
              borderWidth: 1,
              borderColor: "#ebedf0",
              shadowColor: "#0f172a",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 1,
            }}
          >
            <Pressable onPress={changePhoto}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: TEAL }}
                >
                  <Text className="text-white font-bold" style={{ fontSize: 26 }}>
                    {initials}
                  </Text>
                </View>
              )}
              <View
                className="absolute items-center justify-center"
                style={{
                  right: -2,
                  bottom: -2,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: TEAL,
                  borderWidth: 2,
                  borderColor: "#ffffff",
                }}
              >
                {uploadPhoto.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="camera" size={14} color="#ffffff" />
                )}
              </View>
            </Pressable>

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
                style={{
                  color: "#0f766e",
                  fontSize: 12,
                  fontWeight: "700",
                  marginLeft: 4,
                  flexShrink: 1,
                }}
              >
                Care Coordinator
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/coordinator-personal-information" as any)}
              className="rounded-full px-4 py-1.5 mt-3"
              style={{ backgroundColor: "#ccfbf1" }}
            >
              <Text style={{ color: "#0f766e", fontSize: 13, fontWeight: "600" }}>
                Edit profile
              </Text>
            </Pressable>

            {/* Stats */}
            <View className="flex-row w-full mt-5" style={{ gap: 8 }}>
              <StatItem
                icon="pulse"
                tint="#0f766e"
                bg="#f0fdfa"
                border="#99f6e4"
                value={String(activeCases)}
                label="Active cases"
              />
              <StatItem
                icon="people"
                tint="#7c3aed"
                bg="#f5f3ff"
                border="#ddd6fe"
                value={String(totalCases)}
                label="Cases coordinated"
              />
              <StatItem
                icon="calendar"
                tint="#b45309"
                bg="#fffbeb"
                border="#fde68a"
                value={memberSince}
                label="Coordinating since"
              />
            </View>
          </View>
        </View>

        {/* Sections */}
        <SectionLabel title="Account" />
        <Section items={account} />

        <SectionLabel title="Coordination" />
        <Section items={work} />

        <SectionLabel title="Security" />
        <Section items={security} />

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
