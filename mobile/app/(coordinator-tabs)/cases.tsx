import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaseCard } from "@/components/coordinator/CaseCard";
import { useCoordinatorCases } from "@/hooks/useCoordinator";
import { useRefresh } from "@/hooks/useRefresh";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 6, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function CoordinatorCasesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: cases, isLoading, refetch } = useCoordinatorCases();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const list = cases ?? [];
  const current = list.filter((c) => c.status !== "CANCELLED");
  const past = list.filter((c) => c.status === "CANCELLED");

  return (
    <View className="flex-1 bg-background">
      {/* Fixed header — content scrolls beneath it */}
      <View className="px-5 pb-2 bg-background" style={{ paddingTop: top + 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-1">Cases</Text>
        <Text className="text-muted text-sm">
          Every family you&apos;re coordinating.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24 }}
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
      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginVertical: 24 }} />
      ) : list.length === 0 ? (
        <View className="items-center" style={{ marginTop: 48 }}>
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#ccfbf1" }}
          >
            <Ionicons name="people-outline" size={28} color="#0d9488" />
          </View>
          <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
            No cases yet
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
            New cases appear here once a family is matched to you.
          </Text>
        </View>
      ) : (
        <>
          {current.length > 0 && (
            <>
              {past.length > 0 && <SectionLabel title="Current" />}
              {current.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onPress={(c) => router.push(`/coordinator-case/${c.id}` as any)}
                />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <SectionLabel title="Past cases" />
              {past.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onPress={(c) => router.push(`/coordinator-case/${c.id}` as any)}
                />
              ))}
            </>
          )}
        </>
      )}
      </ScrollView>
    </View>
  );
}
