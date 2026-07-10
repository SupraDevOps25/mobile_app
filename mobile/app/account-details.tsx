import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import {
  useAuthProfile,
  useUpdateAuthProfile,
  useUploadAuthPhoto,
} from "@/hooks/useProfile";
import { initialsOf } from "@/lib/avatar";
import { pickImageFromLibrary, takePhoto } from "@/lib/pick";
import { roleMeta } from "@/lib/roles";
import {
  personalInfoSchema,
  toE164Phone,
  toLocalPhone,
  type PersonalInfoFormValues,
} from "@/schemas/profile.schemas";

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      className="text-foreground font-semibold mb-2 ml-1"
      style={{ fontSize: 13 }}
    >
      {children}
    </Text>
  );
}

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { updateUser } = useAuth();

  const { data: profile, isLoading } = useAuthProfile();
  const update = useUpdateAuthProfile();
  const uploadPhoto = useUploadAuthPhoto();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: toLocalPhone(profile.phone),
        }
      : undefined,
  });

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

  function onSubmit(values: PersonalInfoFormValues) {
    update.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: toE164Phone(values.phone),
      },
      {
        onSuccess: (updated) => {
          updateUser({ firstName: updated.firstName });
          Alert.alert("Saved", "Your details have been updated.", [
            { text: "Done", onPress: () => router.back() },
          ]);
        },
        onError: (err: Error) => {
          if (/phone/i.test(err.message)) {
            setError("phone", { message: err.message });
          } else {
            Alert.alert("Couldn't save", err.message);
          }
        },
      },
    );
  }

  const meta = profile ? roleMeta(profile.role) : roleMeta("FAMILY");
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-background">
        <StatusBar style="dark" />

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
            Personal information
          </Text>
        </View>

        {isLoading || !profile ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={meta.color} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Identity summary */}
              <View className="items-center mt-2 mb-6">
                <Pressable onPress={changePhoto}>
                  {profile.photoUrl ? (
                    <Image
                      source={{ uri: profile.photoUrl }}
                      style={{ width: 88, height: 88, borderRadius: 44 }}
                    />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: meta.color }}
                    >
                      <Text className="text-white font-bold" style={{ fontSize: 28 }}>
                        {initialsOf(fullName || profile.email)}
                      </Text>
                    </View>
                  )}
                  <View
                    className="absolute items-center justify-center"
                    style={{
                      right: -2,
                      bottom: -2,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: meta.color,
                      borderWidth: 2,
                      borderColor: "#ffffff",
                    }}
                  >
                    {uploadPhoto.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Ionicons name="camera" size={15} color="#ffffff" />
                    )}
                  </View>
                </Pressable>
                <Text
                  className="text-foreground font-bold"
                  style={{ fontSize: 18, marginTop: 12 }}
                >
                  {fullName || "Your name"}
                </Text>
                <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 2 }}>
                  {meta.label}
                </Text>
                <Text className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
                  Tap the photo to {profile.photoUrl ? "change" : "add"} it
                </Text>
              </View>

              {/* Editable details */}
              <FieldLabel>First name</FieldLabel>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="First name"
                    autoCapitalize="words"
                    error={errors.firstName?.message}
                  />
                )}
              />

              <FieldLabel>Last name</FieldLabel>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Last name"
                    autoCapitalize="words"
                    error={errors.lastName?.message}
                  />
                )}
              />

              <FieldLabel>Phone number</FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="0244123456"
                    keyboardType="phone-pad"
                    error={errors.phone?.message}
                  />
                )}
              />

              {/* Read-only email */}
              <FieldLabel>Email address</FieldLabel>
              <View
                className="flex-row items-center border rounded-full px-5 mb-2"
                style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
              >
                <Text
                  className="flex-1 py-4 text-muted"
                  style={{ fontSize: 14 }}
                  numberOfLines={1}
                >
                  {profile.email}
                </Text>
                <Ionicons name="lock-closed" size={16} color="#9ca3af" />
              </View>
              <Text className="text-muted ml-1" style={{ fontSize: 12, lineHeight: 17 }}>
                Contact support to change your email address.
              </Text>
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
                title="Save changes"
                variant="navy"
                loading={update.isPending}
                disabled={!isDirty}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
