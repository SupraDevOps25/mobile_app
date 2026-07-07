import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  useCaregiverProfile,
  useUpdateCaregiverProfile,
  useUploadCaregiverPhoto,
} from "@/hooks/useCaregiverProfile";
import { useAuthProfile, useUpdateAuthProfile } from "@/hooks/useProfile";
import {
  DateOfBirthField,
  GenderPicker,
  ServiceAreaField,
} from "@/components/caregiver/profile-fields";
import { initialsOf } from "@/lib/avatar";
import { pickImageFromLibrary, takePhoto } from "@/lib/pick";
import { toE164Phone, toLocalPhone } from "@/schemas/profile.schemas";
import type { ApiGender } from "@/services/subscription.service";

const GREEN = "#16a34a";
const LANGUAGE_OPTIONS = ["English", "Twi", "Ga", "Hausa", "French", "Ewe"];

function FieldLabel({
  children,
  hint,
}: {
  children: string;
  hint?: string;
}) {
  return (
    <>
      <Text
        className="text-muted font-semibold"
        style={{
          fontSize: 11,
          letterSpacing: 1,
          marginTop: 22,
          marginBottom: hint ? 4 : 10,
        }}
      >
        {children.toUpperCase()}
      </Text>
      {hint ? (
        <Text
          style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 17, marginBottom: 10 }}
        >
          {hint}
        </Text>
      ) : null}
    </>
  );
}

export default function CaregiverPersonalInfoScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { updateUser } = useAuth();

  const { data: account } = useAuthProfile();
  const updateAccount = useUpdateAuthProfile();
  const { data: profile, isLoading } = useCaregiverProfile();
  const update = useUpdateCaregiverProfile();
  const uploadPhoto = useUploadCaregiverPhoto();

  // Account details (name + phone live on the User via /auth/profile).
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  // Caregiver profile fields.
  const [gender, setGender] = useState<ApiGender | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [hasExp, setHasExp] = useState(false);
  const [years, setYears] = useState("");

  // Seed the account fields once the account loads.
  useEffect(() => {
    if (!account) return;
    setFirstName(account.firstName);
    setLastName(account.lastName);
    setPhone(toLocalPhone(account.phone));
  }, [account]);

  // Seed the caregiver-profile fields once the profile loads.
  useEffect(() => {
    if (!profile) return;
    setGender(profile.gender);
    setDob(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : null);
    setBio(profile.bio ?? "");
    setAddress(profile.address ?? "");
    setServiceArea(profile.serviceAreas.join(", "));
    if (profile.lat != null && profile.lng != null) {
      setCoords({ lat: profile.lat, lng: profile.lng });
    }
    setLanguages(profile.languages);
    setHasExp(profile.hasHomecareExp);
    setYears(profile.yearsExperience ? String(profile.yearsExperience) : "");
  }, [profile]);

  const fullName = account
    ? `${account.firstName} ${account.lastName}`.trim()
    : "";
  const photoUrl = profile?.photoUrl ?? null;

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

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

  async function onSave() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing name", "Enter your first and last name.");
      return;
    }
    if (!/^(?:0\d{9}|\d{9})$/.test(phone)) {
      Alert.alert(
        "Invalid phone",
        "Enter a valid Ghana number (e.g. 0244123456).",
      );
      return;
    }

    try {
      // Name + phone first (this can 409 on a duplicate phone).
      const updated = await updateAccount.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: toE164Phone(phone),
      });
      await update.mutateAsync({
        bio: bio.trim(),
        gender: gender ?? undefined,
        dateOfBirth: dob ?? undefined,
        address: address.trim(),
        serviceAreas: serviceArea
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages,
        hasHomecareExp: hasExp,
        yearsExperience: hasExp ? parseInt(years, 10) || 0 : 0,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      });
      updateUser({ firstName: updated.firstName });
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Couldn't save",
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

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
            <ActivityIndicator color={GREEN} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            >
              {/* Profile photo */}
              <View className="items-center mt-2">
                <Pressable onPress={changePhoto}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                    />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: "#f0fdf4",
                        borderWidth: 2,
                        borderColor: "#bbf7d0",
                        borderStyle: "dashed",
                      }}
                    >
                      {fullName ? (
                        <Text style={{ color: GREEN, fontSize: 28, fontWeight: "700" }}>
                          {initialsOf(fullName)}
                        </Text>
                      ) : (
                        <Ionicons name="camera-outline" size={26} color={GREEN} />
                      )}
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
                      backgroundColor: GREEN,
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

              {/* Account details: name + phone */}
              <FieldLabel>Your details</FieldLabel>
              <View className="flex-row" style={{ gap: 12 }}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  maxFontSizeMultiplier={1.2}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    borderRadius: 9999,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    fontSize: 16,
                    color: "#111827",
                  }}
                />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  maxFontSizeMultiplier={1.2}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    borderRadius: 9999,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    fontSize: 16,
                    color: "#111827",
                  }}
                />
              </View>
              <View
                className="flex-row items-center rounded-full px-4"
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <Ionicons name="call-outline" size={18} color="#6b7280" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0244123456"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxFontSizeMultiplier={1.2}
                  style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 16, color: "#111827" }}
                />
              </View>
              {account?.email ? (
                <View
                  className="flex-row items-center rounded-full px-4"
                  style={{ marginTop: 12, backgroundColor: "#f3f4f6" }}
                >
                  <Ionicons name="mail-outline" size={18} color="#9ca3af" />
                  <Text
                    className="flex-1 text-muted"
                    style={{ paddingVertical: 14, marginLeft: 8, fontSize: 16 }}
                    numberOfLines={1}
                  >
                    {account.email}
                  </Text>
                  <Ionicons name="lock-closed" size={15} color="#9ca3af" />
                </View>
              ) : null}

              {/* Gender */}
              <FieldLabel>Gender</FieldLabel>
              <GenderPicker value={gender} onChange={setGender} />

              {/* Date of birth */}
              <FieldLabel>Date of birth</FieldLabel>
              <DateOfBirthField initialIso={dob} onChange={setDob} />

              {/* Home address */}
              <FieldLabel hint="Where you personally live. Kept private — used for verification only, never shown to families.">
                Home address
              </FieldLabel>
              <View
                className="flex-row items-center rounded-full px-4"
                style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
              >
                <Ionicons name="home-outline" size={18} color="#6b7280" />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="House number, street, area where you live"
                  placeholderTextColor="#9ca3af"
                  maxFontSizeMultiplier={1.2}
                  style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 16, color: "#111827" }}
                />
              </View>

              {/* Short bio */}
              <FieldLabel>Short bio</FieldLabel>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell families about your experience and the care you provide…"
                placeholderTextColor="#9ca3af"
                multiline
                maxFontSizeMultiplier={1.2}
                style={{
                  minHeight: 110,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  backgroundColor: "#f9fafb",
                  borderRadius: 16,
                  padding: 14,
                  fontSize: 16,
                  color: "#111827",
                  textAlignVertical: "top",
                }}
              />

              {/* Service area */}
              <FieldLabel hint="The area(s) where you want to work. We match you with families living nearby — this doesn't have to be where you live.">
                Service area
              </FieldLabel>
              <ServiceAreaField
                value={serviceArea}
                onChangeText={setServiceArea}
                onLocated={(loc) => {
                  setServiceArea(
                    [loc.area, loc.city].filter(Boolean).join(", ") ||
                      loc.address,
                  );
                  setCoords({ lat: loc.lat, lng: loc.lng });
                }}
              />

              {/* Languages */}
              <FieldLabel>Languages spoken</FieldLabel>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = languages.includes(lang);
                  return (
                    <Pressable
                      key={lang}
                      onPress={() => toggleLanguage(lang)}
                      className="rounded-full px-4 py-2"
                      style={{
                        borderWidth: 1,
                        borderColor: active ? GREEN : "#e5e7eb",
                        backgroundColor: active ? GREEN : "#f9fafb",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: active ? "#ffffff" : "#6b7280",
                        }}
                      >
                        {lang}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Homecare experience (competency) */}
              <FieldLabel>Experience</FieldLabel>
              <Text className="text-foreground" style={{ fontSize: 16, marginBottom: 10 }}>
                Have you worked as a homecare nurse before?
              </Text>
              <View className="flex-row" style={{ gap: 10 }}>
                {[
                  { key: true, label: "Yes" },
                  { key: false, label: "No" },
                ].map((opt) => {
                  const active = hasExp === opt.key;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => setHasExp(opt.key)}
                      className="flex-1 rounded-2xl items-center justify-center"
                      style={{
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: active ? GREEN : "#e5e7eb",
                        backgroundColor: active ? "#f0fdf4" : "#f9fafb",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: active ? "#15803d" : "#6b7280",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {hasExp && (
                <>
                  <FieldLabel>Years of experience</FieldLabel>
                  <View
                    className="flex-row items-center rounded-full px-4"
                    style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
                  >
                    <Ionicons name="briefcase-outline" size={18} color="#6b7280" />
                    <TextInput
                      value={years}
                      onChangeText={(t) => setYears(t.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 5"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxFontSizeMultiplier={1.2}
                      style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 16, color: "#111827" }}
                    />
                    <Text className="text-muted" style={{ fontSize: 13 }}>
                      years
                    </Text>
                  </View>
                </>
              )}
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
                loading={update.isPending || updateAccount.isPending}
                onPress={onSave}
              />
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
