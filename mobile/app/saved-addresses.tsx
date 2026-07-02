import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddresses, useDeleteAddress } from "@/hooks/useFamily";
import type { ApiSavedAddress } from "@/services/family.service";

const LABEL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Work: "briefcase-outline",
  Other: "location-outline",
};

function AddressCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ApiSavedAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const icon = LABEL_ICON[item.label] ?? "location-outline";
  const sub = [item.area, item.city].filter(Boolean).join(", ");
  return (
    <Pressable
      onPress={onEdit}
      className="bg-card rounded-2xl p-4 mb-3"
      style={{ borderWidth: 1, borderColor: item.isDefault ? "#c7d2fe" : "#f3f4f6" }}
    >
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "#eef2ff" }}
        >
          <Ionicons name={icon} size={19} color="#4f46e5" />
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
              {item.label}
            </Text>
            {item.isDefault && (
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#eef2ff" }}
              >
                <Text style={{ color: "#4f46e5", fontSize: 10, fontWeight: "700" }}>
                  Default
                </Text>
              </View>
            )}
          </View>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 18 }}>
            {item.address}
          </Text>
          {sub.length > 0 && (
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              {sub}
            </Text>
          )}
        </View>
        <Pressable onPress={onDelete} hitSlop={10} className="ml-2">
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { data: addresses, isLoading } = useAddresses();
  const remove = useDeleteAddress();

  function confirmDelete(item: ApiSavedAddress) {
    Alert.alert("Delete address", `Remove "${item.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          remove.mutate(item.id, {
            onError: (err: Error) => Alert.alert("Couldn't delete", err.message),
          }),
      },
    ]);
  }

  const list = addresses ?? [];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Saved addresses
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        >
          {list.length === 0 ? (
            <View className="items-center justify-center px-6" style={{ paddingTop: 60 }}>
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: "#eef2ff" }}
              >
                <Ionicons name="location-outline" size={28} color="#4f46e5" />
              </View>
              <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
                No saved addresses
              </Text>
              <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                Save a home or work address to reuse it quickly when requesting care.
              </Text>
            </View>
          ) : (
            list.map((item) => (
              <AddressCard
                key={item.id}
                item={item}
                onEdit={() => router.push(`/address-edit?id=${item.id}` as any)}
                onDelete={() => confirmDelete(item)}
              />
            ))
          )}

          <Pressable
            onPress={() => router.push("/address-edit" as any)}
            className="flex-row items-center justify-center rounded-2xl mt-2 py-4"
            style={{ borderWidth: 1.5, borderColor: "#c7d2fe", borderStyle: "dashed" }}
          >
            <Ionicons name="add" size={18} color="#4f46e5" />
            <Text style={{ color: "#4f46e5", fontSize: 14, fontWeight: "700", marginLeft: 6 }}>
              Add address
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
