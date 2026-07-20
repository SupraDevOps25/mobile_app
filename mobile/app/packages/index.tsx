import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomPackageRequestSheet } from "@/components/packages/CustomPackageRequestSheet";
import { PackageCard } from "@/components/packages/PackageCard";
import { toPackageView } from "@/constants/package-presentation";
import { usePackages } from "@/hooks/usePackages";
import { useRefresh } from "@/hooks/useRefresh";

export default function PackagesScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: packages, isLoading, isError, refetch } = usePackages();
  const { refreshing, onRefresh } = useRefresh(refetch);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-3"
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
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Care packages
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
        <Text className="text-foreground font-bold" style={{ fontSize: 22, marginTop: 4 }}>
          Choose a care package
        </Text>
        <Text
          className="text-muted"
          style={{ fontSize: 14, marginTop: 6, marginBottom: 20, lineHeight: 20 }}
        >
          Subscribe to a package and we&apos;ll match and coordinate the right care
          team for your loved one.
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#1e3a8a" style={{ marginVertical: 32 }} />
        ) : isError ? (
          <Text className="text-muted" style={{ marginVertical: 24 }}>
            Couldn&apos;t load packages. Pull down to retry.
          </Text>
        ) : (
          (packages ?? []).map((pkg) => {
            const view = toPackageView(pkg);
            return (
              <PackageCard
                key={view.type}
                pkg={view}
                onPress={(p) => router.push(`/packages/${p.type}` as any)}
              />
            );
          })
        )}

        {/* No package fits? — describe custom needs; emailed to the admin team */}
        <View
          className="rounded-2xl p-4 mt-4"
          style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb" }}
        >
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Ionicons name="sparkles-outline" size={18} color="#1e3a8a" />
            <Text className="text-foreground font-bold" style={{ fontSize: 15, flex: 1 }}>
              No package fits your situation?
            </Text>
          </View>
          <Text className="text-muted" style={{ fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            Tell us what you need and our team will tailor the right care plan for
            your loved one.
          </Text>
          <Pressable
            onPress={() => setRequestOpen(true)}
            className="rounded-2xl items-center justify-center mt-3 flex-row"
            style={{ backgroundColor: "#1e3a8a", paddingVertical: 13, gap: 8 }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#ffffff" />
            <Text className="text-white font-bold" style={{ fontSize: 14 }}>
              Tell us what you need
            </Text>
          </Pressable>
        </View>

        {/* How it works note */}
        <View
          className="flex-row rounded-2xl p-4 mt-3"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
          <Text
            style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
          >
            You choose a package — Supracarer assigns and manages a dedicated care
            team, including a Care Coordinator and backup nurses.
          </Text>
        </View>
      </ScrollView>

      <CustomPackageRequestSheet
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </View>
  );
}
