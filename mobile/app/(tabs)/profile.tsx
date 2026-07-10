import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pickImageFromLibrary, takePhoto } from "@/lib/pick";
import { rateApp } from "@/lib/rate";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddresses,
  useFamilyProfile,
  useFamilyStats,
  usePaymentMethods,
  useUploadFamilyPhoto,
} from "@/hooks/useFamily";

type RowItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  subtitle: string;
  value?: string;
  badge?: string;
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

        {item.badge && (
          <View
            className="rounded-full px-2 py-0.5 mr-2"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <Text className="text-white font-semibold" style={{ fontSize: 10 }}>
              {item.badge}
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
    <View className="mx-5">
      <View
        className="bg-card rounded-2xl overflow-hidden"
        style={{
          borderWidth: 1,
          borderColor: "#eef0f3",
          shadowColor: "#0f172a",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 1,
        }}
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

export default function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: stats } = useFamilyStats();
  const { data: profile } = useFamilyProfile();
  const { data: addresses } = useAddresses();
  const { data: paymentMethods } = usePaymentMethods();
  const uploadPhoto = useUploadFamilyPhoto();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";
  const initials = firstName.slice(0, 2).toUpperCase();
  const photoUrl = profile?.photoUrl ?? null;

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

  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  // TODO: replace with real navigation as each editable screen is built.
  const soon = (label: string) =>
    Alert.alert(label, "This screen is coming next.");

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

  function handleDeleteAccount() {
    router.push("/delete-account" as any);
  }

  const account: RowItem[] = [
    {
      key: "personal",
      icon: "person-outline",
      tint: "#4f46e5",
      bg: "#eef2ff",
      title: "Personal information",
      subtitle: "Name, phone, email",
      onPress: () => router.push("/personal-information" as any),
    },
    {
      key: "addresses",
      icon: "location-outline",
      tint: "#16a34a",
      bg: "#f0fdf4",
      title: "Saved addresses",
      subtitle: "Home, work, other",
      value: addresses?.length ? `${addresses.length} saved` : undefined,
      onPress: () => router.push("/saved-addresses" as any),
    },
    {
      key: "payment",
      icon: "card-outline",
      tint: "#2563eb",
      bg: "#eff6ff",
      title: "Payment methods",
      subtitle: "Cards and mobile money",
      value: paymentMethods?.length ? `${paymentMethods.length} saved` : undefined,
      onPress: () => router.push("/payment-methods" as any),
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
      value: "English ",
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
    {
      key: "delete",
      icon: "trash-outline",
      tint: "#dc2626",
      bg: "#fef2f2",
      title: "Delete account",
      subtitle: "Permanently remove your data",
      danger: true,
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Fixed header — the content scrolls beneath this, so the notch/status
          bar area always stays covered. */}
      <View
        className="flex-row items-center justify-between px-5 pb-3 bg-background"
        style={{ paddingTop: top + 8 }}
      >
        <Text className="text-foreground font-bold" style={{ fontSize: 24 }}>
          My Profile
        </Text>
        <Pressable
          onPress={() => soon("Appearance")}
          hitSlop={8}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="sunny-outline" size={18} color="#374151" />
        </Pressable>
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
            borderColor: "#eef0f3",
            shadowColor: "#0f172a",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 1,
          }}
        >
          {/* Avatar with edit badge — tap to change the profile photo */}
          <Pressable onPress={changePhoto}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                <Text className="text-white font-bold" style={{ fontSize: 26 }}>
                  {initials}
                </Text>
              </View>
            )}
            <View
              className="absolute w-7 h-7 rounded-full items-center justify-center"
              style={{
                bottom: -2,
                right: -2,
                backgroundColor: "#eef2ff",
                borderWidth: 2,
                borderColor: "#ffffff",
              }}
            >
              {uploadPhoto.isPending ? (
                <ActivityIndicator color="#4f46e5" size="small" />
              ) : (
                <Ionicons name="camera" size={13} color="#4f46e5" />
              )}
            </View>
          </Pressable>

          <Text className="text-foreground font-bold" style={{ fontSize: 20, marginTop: 12 }}>
            {firstName}
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 2 }}>
           Family account holder
          </Text>

        

          <Pressable
            onPress={() => router.push("/personal-information" as any)}
            className="rounded-full px-4 py-1.5 mt-3"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Text style={{ color: "#4f46e5", fontSize: 13, fontWeight: "600" }}>
              Edit profile
            </Text>
          </Pressable>

          {/* Stats */}
          <View
            className="flex-row w-full mt-5 pt-5"
            style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6", gap: 8 }}
          >
            <StatItem
              value={String(stats?.carePlans ?? 0)}
              label="Total bookings"
              icon="briefcase"
              tint="#1e3a8a"
              bg="#eef2ff"
              border="#bfdbfe"
            />
            <StatItem
              value={String(stats?.caregivers ?? 0)}
              label="Caregivers used"
              icon="people"
              tint="#16a34a"
              bg="#f0fdf4"
              border="#bbf7d0"
            />
            <StatItem
              value={memberSince}
              label="Member since "
              icon="ribbon"
              tint="#d97706"
              bg="#fffbeb"
              border="#fde68a"
            />
          </View>
        </View>
      </View>

      {/* Sections */}
      <SectionLabel title="Account" />
      <Section items={account} />

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
