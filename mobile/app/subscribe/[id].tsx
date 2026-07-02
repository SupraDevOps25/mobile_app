import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PackageSummaryCard } from "@/components/packages/PackageSummaryCard";
import { Input } from "@/components/ui/Input";
import { toPackageView } from "@/constants/package-presentation";
import { useAddresses } from "@/hooks/useFamily";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { usePackage } from "@/hooks/usePackages";
import { useSubscribe } from "@/hooks/useSubscription";
import {
  subscribeSchema,
  type SubscribeFormValues,
} from "@/schemas/subscribe.schemas";
import type { ApiPackageType } from "@/services/package.service";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function SubscribeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const packageType = id as ApiPackageType;

  const { data, isLoading } = usePackage(packageType);
  const subscribe = useSubscribe();
  const { data: savedAddresses } = useAddresses();
  const { getCurrent, loading: locating } = useDeviceLocation();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: "MALE",
      relationToAccount: "",
      area: "",
      city: "Accra",
      address: "",
      conditions: "",
      basicCareNeeds: "",
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Package not found.</Text>
      </View>
    );
  }

  const pkg = toPackageView(data);

  function applyAddress(a: {
    address: string;
    area?: string | null;
    city?: string | null;
  }) {
    setValue("address", a.address, { shouldValidate: true });
    if (a.area) setValue("area", a.area, { shouldValidate: true });
    if (a.city) setValue("city", a.city, { shouldValidate: true });
  }

  async function handleUseLocation() {
    const loc = await getCurrent();
    if (loc) applyAddress(loc);
  }

  function onSubmit(values: SubscribeFormValues) {
    const conditions = values.conditions
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    subscribe.mutate(
      {
        packageType,
        careRecipient: {
          name: values.name.trim(),
          age: parseInt(values.age, 10),
          gender: values.gender,
          relationToAccount: values.relationToAccount.trim(),
          area: values.area.trim(),
          city: values.city.trim(),
          address: values.address.trim(),
          conditions,
          basicCareNeeds: values.basicCareNeeds.trim(),
        },
      },
      {
        onSuccess: () =>
          router.replace(`/subscribe/confirmed?packageType=${packageType}` as any),
        onError: (err: Error) =>
          Alert.alert("Couldn't subscribe", err.message),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View
          className="flex-row items-center px-5 pb-3"
          style={{ paddingTop: top + 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            disabled={subscribe.isPending}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "#f3f4f6" }}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
            Who needs care?
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <View style={{ marginTop: 4 }}>
            <PackageSummaryCard pkg={pkg} />
          </View>

          <Text
            className="text-muted"
            style={{ fontSize: 13, marginTop: 14, lineHeight: 19 }}
          >
            Tell us about your loved one so we can match the right care team.
          </Text>

          <SectionLabel title="Care recipient" />

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="age"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    placeholder="Age"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    error={errors.age?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Controller
                control={control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row mb-4" style={{ gap: 8 }}>
                    {(["MALE", "FEMALE"] as const).map((g) => {
                      const active = value === g;
                      return (
                        <Pressable
                          key={g}
                          onPress={() => onChange(g)}
                          className="flex-1 rounded-full items-center justify-center"
                          style={{
                            paddingVertical: 14,
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
                            {g === "MALE" ? "Male" : "Female"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="relationToAccount"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Relationship to you (e.g. Father)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.relationToAccount?.message}
              />
            )}
          />

          <SectionLabel title="Location" />

          {/* Use current location */}
          <Pressable
            onPress={handleUseLocation}
            disabled={locating}
            className="flex-row items-center rounded-2xl px-4 py-3 mb-3"
            style={{ backgroundColor: "#eef2ff" }}
          >
            {locating ? (
              <ActivityIndicator color="#4f46e5" size="small" />
            ) : (
              <Ionicons name="navigate" size={18} color="#4f46e5" />
            )}
            <Text
              style={{ color: "#3730a3", fontSize: 13, fontWeight: "700", marginLeft: 8 }}
            >
              {locating ? "Getting your location…" : "Use my current location"}
            </Text>
          </Pressable>

          {/* Saved addresses */}
          {(savedAddresses ?? []).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              className="mb-3"
            >
              {(savedAddresses ?? []).map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() =>
                    applyAddress({ address: a.address, area: a.area, city: a.city })
                  }
                  className="flex-row items-center rounded-full px-3 py-2"
                  style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
                >
                  <Ionicons name="location-outline" size={13} color="#4f46e5" />
                  <Text style={{ color: "#374151", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="area"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    placeholder="Area"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.area?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="city"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    placeholder="City"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.city?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="address"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Home address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
              />
            )}
          />

          <SectionLabel title="Care needs" />

          <Controller
            control={control}
            name="conditions"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Conditions, comma separated (optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.conditions?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="basicCareNeeds"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Day-to-day care needed (e.g. medication, mobility, companionship)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                style={{ minHeight: 72, textAlignVertical: "top" }}
                error={errors.basicCareNeeds?.message}
              />
            )}
          />

          <View
            className="flex-row rounded-2xl p-4 mt-2"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
            <Text
              style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
            >
              No payment now — Supracarer invoices at the end of each month. After
              you subscribe, we match your care team and a Care Coordinator reaches
              out.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View
          className="px-5 pt-4 bg-background"
          style={{
            paddingBottom: bottom + 12,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
          }}
        >
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={subscribe.isPending}
            className="rounded-2xl items-center justify-center py-4 flex-row"
            style={{
              backgroundColor: subscribe.isPending ? "#9ca3af" : "#1e3a8a",
              gap: 8,
            }}
          >
            {subscribe.isPending ? (
              <>
                <ActivityIndicator color="#ffffff" />
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                  Submitting…
                </Text>
              </>
            ) : (
              <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                Subscribe to {pkg.name}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
