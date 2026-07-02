import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
} from "@/hooks/useFamily";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";

const LABELS = ["Home", "Work", "Other"] as const;

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-foreground font-semibold mb-2 ml-1" style={{ fontSize: 13 }}>
      {children}
    </Text>
  );
}

function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View
      className="border rounded-2xl px-4 mb-4"
      style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        className="text-foreground"
        style={{
          fontSize: 14,
          paddingVertical: 14,
          minHeight: multiline ? 60 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

export default function AddressEditScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: addresses } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const { getCurrent, loading: locating } = useDeviceLocation();

  const existing = id ? addresses?.find((a) => a.id === id) : undefined;

  const [label, setLabel] = useState<string>("Home");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Hydrate the form once the existing address is available.
  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setAddress(existing.address);
      setArea(existing.area ?? "");
      setCity(existing.city ?? "");
      setIsDefault(existing.isDefault);
      if (existing.lat != null && existing.lng != null) {
        setCoords({ lat: existing.lat, lng: existing.lng });
      }
    }
  }, [existing]);

  async function handleUseLocation() {
    const loc = await getCurrent();
    if (!loc) return;
    if (loc.address) setAddress(loc.address);
    if (loc.area) setArea(loc.area);
    if (loc.city) setCity(loc.city);
    setCoords({ lat: loc.lat, lng: loc.lng });
  }

  function handleSave() {
    if (!address.trim()) {
      Alert.alert("Address required", "Enter an address or use your current location.");
      return;
    }
    const payload = {
      label: label.trim() || "Other",
      address: address.trim(),
      area: area.trim() || undefined,
      city: city.trim() || undefined,
      lat: coords?.lat,
      lng: coords?.lng,
      isDefault,
    };
    const onDone = {
      onSuccess: () => router.back(),
      onError: (err: Error) => Alert.alert("Couldn't save", err.message),
    };
    if (id) {
      update.mutate({ id, payload }, onDone);
    } else {
      create.mutate(payload, onDone);
    }
  }

  const saving = create.isPending || update.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            {id ? "Edit address" : "Add address"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {/* Use current location */}
          <Pressable
            onPress={handleUseLocation}
            disabled={locating}
            className="flex-row items-center rounded-2xl px-4 py-4 mt-2 mb-5"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: "#ffffff" }}
            >
              {locating ? (
                <ActivityIndicator color="#4f46e5" size="small" />
              ) : (
                <Ionicons name="navigate" size={18} color="#4f46e5" />
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-bold" style={{ color: "#3730a3", fontSize: 14 }}>
                {locating ? "Getting your location…" : "Use my current location"}
              </Text>
              <Text style={{ color: "#6366f1", fontSize: 12, marginTop: 1 }}>
                Auto-fill the address from your GPS
              </Text>
            </View>
          </Pressable>

          {/* Label */}
          <FieldLabel>Label</FieldLabel>
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {LABELS.map((l) => {
              const active = label === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLabel(l)}
                  className="flex-1 rounded-full items-center justify-center py-3"
                  style={{
                    borderWidth: 1,
                    borderColor: active ? "#1e3a8a" : "#e5e7eb",
                    backgroundColor: active ? "#1e3a8a" : "#f9fafb",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: active ? "#ffffff" : "#6b7280",
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FieldLabel>Address</FieldLabel>
          <TextField
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. 12 Independence Ave, Ridge"
            multiline
          />

          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Area</FieldLabel>
              <TextField value={area} onChangeText={setArea} placeholder="Area" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>City</FieldLabel>
              <TextField value={city} onChangeText={setCity} placeholder="City" />
            </View>
          </View>

          {/* Default toggle */}
          <View
            className="flex-row items-center justify-between rounded-2xl px-4 py-3"
            style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
          >
            <View className="flex-1 pr-3">
              <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                Set as default
              </Text>
              <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
                Used first when you request care
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ true: "#1e3a8a", false: "#e5e7eb" }}
              thumbColor="#ffffff"
            />
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View
          className="bg-white px-5 pt-3"
          style={{
            paddingBottom: bottom + 12,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
          }}
        >
          <Button
            title={id ? "Save changes" : "Save address"}
            variant="navy"
            loading={saving}
            onPress={handleSave}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
