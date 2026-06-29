import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaseCard } from "@/components/coordinator/CaseCard";
import { useCoordinatorCases } from "@/hooks/useCoordinator";

export default function CoordinatorCasesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: cases, isLoading } = useCoordinatorCases();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 16, paddingHorizontal: 20, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-foreground text-2xl font-bold mb-1">Cases</Text>
      <Text className="text-muted text-sm mb-5">
        Every family you&apos;re coordinating.
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#0d9488" style={{ marginVertical: 24 }} />
      ) : (cases ?? []).length === 0 ? (
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
        (cases ?? []).map((item) => (
          <CaseCard
            key={item.id}
            item={item}
            onPress={(c) => router.push(`/coordinator-case/${c.id}` as any)}
          />
        ))
      )}
    </ScrollView>
  );
}
