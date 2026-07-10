import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verificationMeta } from "@/constants/verification";
import { useAuth } from "@/hooks/useAuth";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useAuthProfile } from "@/hooks/useProfile";
import { initialsOf } from "@/lib/avatar";
import { rateApp } from "@/lib/rate";

const GREEN = "#16a34a";

type RowItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
  value?: string;
  badge?: { text: string; color: string; bg: string };
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
        {item.badge && (
          <View
            className="rounded-full px-2 py-0.5 mr-2"
            style={{ backgroundColor: item.badge.bg }}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 10, color: item.badge.color }}
            >
              {item.badge.text}
            </Text>
          </View>
        )}
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

export default function CaregiverProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: account } = useAuthProfile();
  const { data: profile } = useCaregiverProfile();

  const fullName = account
    ? `${account.firstName} ${account.lastName}`.trim()
    : user?.firstName || user?.email?.split("@")[0] || "Caregiver";
  const initials = initialsOf(fullName || "Caregiver");
  const photoUrl = profile?.photoUrl ?? null;

  const memberSince = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  const verification = verificationMeta(
    profile?.verificationStatus ?? "UNVERIFIED",
  );
  const rating = profile?.rating ? profile.rating.toFixed(1) : "—";
  const reviews = profile?.totalReviews ?? 0;

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

  const account_rows: RowItem[] = [
    {
      key: "personal",
      icon: "person-outline",
      tint: GREEN,
      bg: "#f0fdf4",
      title: "Personal information",
      subtitle: "Photo, bio, experience, languages",
      onPress: () => router.push("/caregiver-personal-information" as any),
    },
    {
      key: "credentials",
      icon: "shield-checkmark-outline",
      tint: "#2563eb",
      bg: "#eff6ff",
      title: "Credentials",
      subtitle: "Ghana Card & PIN card",
      badge: {
        text: verification.label,
        color: verification.color,
        bg: verification.bg,
      },
      onPress: () => router.push("/caregiver-credentials" as any),
    },
  ];

  const work: RowItem[] = [
    {
      key: "availability",
      icon: "checkmark-circle-outline",
      tint: GREEN,
      bg: "#f0fdf4",
      title: "Availability",
      subtitle: "Turn case offers on or off",
      onPress: () => router.push("/(caregiver-tabs)/availability" as any),
    },
    {
      key: "schedule",
      icon: "calendar-outline",
      tint: "#7c3aed",
      bg: "#f5f3ff",
      title: "Working schedule",
      subtitle: "Days, hours and visit limit",
      onPress: () => router.push("/(caregiver-tabs)/schedule" as any),
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
      tint: GREEN,
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
      <View className="px-5 pb-3 bg-background" style={{ paddingTop: top + 8 }}>
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
            style={{
              borderWidth: 1,
              borderColor: "#ebedf0",
              shadowColor: "#0f172a",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
            }}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: GREEN }}
              >
                <Text className="text-white font-bold" style={{ fontSize: 26 }}>
                  {initials}
                </Text>
              </View>
            )}

            <Text
              className="text-foreground font-bold"
              style={{ fontSize: 20, marginTop: 12 }}
            >
              {fullName}
            </Text>
            <View
              className="flex-row items-center rounded-full px-3 py-1 mt-2"
              style={{ backgroundColor: verification.bg }}
            >
              <Ionicons
                name={verification.icon}
                size={13}
                color={verification.color}
              />
              <Text
                style={{
                  color: verification.color,
                  fontSize: 12,
                  fontWeight: "700",
                  marginLeft: 4,
                  flexShrink: 1,
                }}
              >
                {verification.label}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/caregiver-personal-information" as any)}
              className="rounded-full px-4 py-1.5 mt-3"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <Text style={{ color: "#15803d", fontSize: 13, fontWeight: "600" }}>
                Edit profile
              </Text>
            </Pressable>

            {/* Stats */}
            <View className="flex-row w-full mt-5" style={{ gap: 8 }}>
              <StatItem
                icon="star"
                tint="#b45309"
                bg="#fffbeb"
                border="#fde68a"
                value={rating}
                label="Ratings"
              />
              <StatItem
                icon="chatbubble-ellipses"
                tint="#1d4ed8"
                bg="#eff6ff"
                border="#bfdbfe"
                value={String(reviews)}
                label="Reviews"
              />
              <StatItem
                icon="calendar"
                tint="#15803d"
                bg="#f0fdf4"
                border="#bbf7d0"
                value={memberSince}
                label="Member since"
              />
            </View>
          </View>
        </View>

        {/* Verification nudge when not yet verified */}
        {profile && profile.verificationStatus !== "VERIFIED" && (
          <Pressable
            onPress={() => router.push("/caregiver-credentials" as any)}
            className="mx-5 mt-4 flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: verification.bg }}
          >
            <Ionicons
              name={verification.icon}
              size={20}
              color={verification.color}
            />
            <Text
              style={{
                color: verification.color,
                fontSize: 12.5,
                marginLeft: 8,
                flex: 1,
                lineHeight: 18,
              }}
            >
              {verification.hint}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={verification.color} />
          </Pressable>
        )}

        {/* Sections */}
        <SectionLabel title="Account" />
        <Section items={account_rows} />

        <SectionLabel title="Work" />
        <Section items={work} />

        <SectionLabel title="Security" />
        <Section items={security} />

        <SectionLabel title="Preferences" />
        <Section items={preferences} />

        <SectionLabel title="Support" />
        <Section items={support} />

        <SectionLabel title="Account actions" />
        <Section items={actions} />
      </ScrollView>
    </View>
  );
}
