import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import {
  DateOfBirthField,
  GenderPicker,
  ServiceAreaField,
} from "@/components/caregiver/profile-fields";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import {
  useFamilyProfile,
  useUpdateFamilyProfile,
  useUploadFamilyPhoto,
} from "@/hooks/useFamily";
import { initialsOf } from "@/lib/avatar";
import { pickImageFromLibrary, takePhoto } from "@/lib/pick";
import {
  personalInfoSchema,
  toE164Phone,
  toLocalPhone,
  type PersonalInfoFormValues,
} from "@/schemas/profile.schemas";
import type { ApiGender } from "@/services/subscription.service";

const NAVY = "#1e3a8a";

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      className="text-foreground font-semibold mb-2 ml-1"
      style={{ fontSize: 15, marginTop: 18 }}
    >
      {children}
    </Text>
  );
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { updateUser } = useAuth();

  const { data: profile, isLoading } = useFamilyProfile();
  const update = useUpdateFamilyProfile();
  const uploadPhoto = useUploadFamilyPhoto();

  // Profile-only fields (gender / DOB / home location) live outside react-hook-
  // form, seeded once the profile loads.
  const [gender, setGender] = useState<ApiGender | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (!profile) return;
    setGender(profile.gender);
    setDob(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : null);
    setAddress(profile.address ?? "");
    if (profile.lat != null && profile.lng != null) {
      setCoords({ lat: profile.lat, lng: profile.lng });
    }
  }, [profile]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
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
        gender: gender ?? undefined,
        dateOfBirth: dob ?? undefined,
        address: address.trim(),
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
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

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";
  const photoUrl = profile?.photoUrl ?? null;

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
            <ActivityIndicator color={NAVY} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile photo */}
              <View className="items-center mt-2 mb-4">
                <Pressable onPress={changePhoto}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                    />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: NAVY }}
                    >
                      <Text className="text-white font-bold" style={{ fontSize: 30 }}>
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
                      backgroundColor: NAVY,
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
                <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                  Tap to {photoUrl ? "change" : "add a"} profile photo
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

              {/* Gender */}
              <FieldLabel>Gender</FieldLabel>
              <GenderPicker value={gender} onChange={setGender} />

              {/* Date of birth — shows age; used when you book care for yourself */}
              <FieldLabel>Date of birth</FieldLabel>
              <DateOfBirthField initialIso={dob} onChange={setDob} />
              <Text className="text-muted ml-1" style={{ fontSize: 12, marginTop: 6, lineHeight: 17 }}>
                Used to pre-fill your age when you book care for yourself.
              </Text>

              {/* Home location */}
              <FieldLabel>Home area</FieldLabel>
              <ServiceAreaField
                value={address}
                onChangeText={setAddress}
                onLocated={(loc) => {
                  setAddress(
                    [loc.area, loc.city].filter(Boolean).join(", ") ||
                      loc.address,
                  );
                  setCoords({ lat: loc.lat, lng: loc.lng });
                }}
              />

              {/* Read-only email */}
              <FieldLabel>Email address</FieldLabel>
              <View
                className="flex-row items-center border rounded-full px-5 mb-2"
                style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
              >
                <Text
                  className="flex-1 py-4 text-muted"
                  style={{ fontSize: 15 }}
                  numberOfLines={1}
                >
                  {profile.email}
                </Text>
                {profile.emailVerified ? (
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                ) : (
                  <Ionicons name="alert-circle" size={18} color="#d97706" />
                )}
              </View>
              <Text className="text-muted ml-1" style={{ fontSize: 12, lineHeight: 17 }}>
                {profile.emailVerified
                  ? "Your email is verified. Contact support to change it."
                  : "Your email isn't verified yet. Contact support to change it."}
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
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
