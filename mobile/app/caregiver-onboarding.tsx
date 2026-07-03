import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useAuth } from "@/hooks/useAuth";
import {
  useCaregiverDocuments,
  useCaregiverProfile,
  useUpdateCaregiverProfile,
  useUploadCaregiverDocument,
  useUploadCaregiverPhoto,
} from "@/hooks/useCaregiverProfile";
import { useAuthProfile, useUpdateAuthProfile } from "@/hooks/useProfile";
import {
  DateOfBirthField,
  GenderPicker,
  ServiceAreaField,
} from "@/components/caregiver/profile-fields";
import { initialsOf } from "@/lib/avatar";
import { pickDocument, pickImageFromLibrary, takePhoto } from "@/lib/pick";
import { toE164Phone, toLocalPhone } from "@/schemas/profile.schemas";
import type {
  ApiCaregiverDocumentType,
  ApiDocumentStatus,
} from "@/services/caregiver.service";
import type { ApiGender } from "@/services/subscription.service";

const GREEN = "#16a34a";
export const CG_ONBOARDING_SEEN = "cg_onboarding_seen";
const LANGUAGE_OPTIONS = ["English", "Twi", "Ga", "Hausa", "French", "Ewe"];

const STEP_TITLES = [
  "Tell us who you are",
  "Tell families about yourself",
  "Upload your documents",
] as const;
const STEP_SUBTITLES = [
  "Confirm your contact details",
  "Your photo, experience and languages",
  "Ghana Card & Nursing PIN card",
] as const;

const DOCS: {
  type: ApiCaregiverDocumentType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: "GHANA_CARD", title: "Ghana Card / National ID", icon: "card-outline" },
  { type: "PIN_CARD", title: "Nursing & Midwifery PIN card", icon: "ribbon-outline" },
];

const INPUT_STYLE = {
  flex: 1,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#f9fafb",
  borderRadius: 9999,
  paddingVertical: 14,
  paddingHorizontal: 18,
  fontSize: 14,
  color: "#111827",
} as const;

function Label({ children }: { children: string }) {
  return (
    <Text
      className="text-muted font-semibold"
      style={{ fontSize: 11, letterSpacing: 1, marginTop: 20, marginBottom: 10 }}
    >
      {children.toUpperCase()}
    </Text>
  );
}

function docStatusMeta(status: ApiDocumentStatus) {
  if (status === "VERIFIED") return { label: "Verified", color: "#16a34a", bg: "#f0fdf4" };
  if (status === "REJECTED") return { label: "Rejected", color: "#dc2626", bg: "#fef2f2" };
  return { label: "Under review", color: "#d97706", bg: "#fffbeb" };
}

export default function CaregiverOnboardingScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { updateUser } = useAuth();

  const { data: account } = useAuthProfile();
  const updateAccount = useUpdateAuthProfile();
  const { data: profile } = useCaregiverProfile();
  const updateProfile = useUpdateCaregiverProfile();
  const uploadPhoto = useUploadCaregiverPhoto();
  const { data: documents } = useCaregiverDocuments();
  const uploadDoc = useUploadCaregiverDocument();

  const [step, setStep] = useState(0);

  // Step 1 — account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  // Step 2 — profile
  const [gender, setGender] = useState<ApiGender | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [hasExp, setHasExp] = useState(false);
  const [years, setYears] = useState("");
  // Step 3 — credentials
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] =
    useState<ApiCaregiverDocumentType | null>(null);

  useEffect(() => {
    if (!account) return;
    setFirstName(account.firstName);
    setLastName(account.lastName);
    setPhone(toLocalPhone(account.phone));
  }, [account]);

  useEffect(() => {
    if (!profile) return;
    setGender(profile.gender);
    setDob(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : null);
    setBio(profile.bio ?? "");
    setServiceArea(profile.serviceAreas.join(", "));
    if (profile.lat != null && profile.lng != null) {
      setCoords({ lat: profile.lat, lng: profile.lng });
    }
    setLanguages(profile.languages);
    setHasExp(profile.hasHomecareExp);
    setYears(profile.yearsExperience ? String(profile.yearsExperience) : "");
  }, [profile]);

  useEffect(() => {
    if (!documents) return;
    const seed: Record<string, string> = {};
    for (const d of documents) if (d.idNumber) seed[d.type] = d.idNumber;
    setNumbers((prev) => ({ ...seed, ...prev }));
  }, [documents]);

  const fullName = `${firstName} ${lastName}`.trim();
  const photoUrl = profile?.photoUrl ?? null;
  const docByType = (t: ApiCaregiverDocumentType) =>
    (documents ?? []).find((d) => d.type === t);
  const allDocsUploaded = DOCS.every((d) => docByType(d.type));

  async function finish() {
    await AsyncStorage.setItem(CG_ONBOARDING_SEEN, "true");
  }

  function skip() {
    Alert.alert(
      "Finish later?",
      "You can complete your profile and upload documents anytime from your profile tab.",
      [
        { text: "Keep going", style: "cancel" },
        {
          text: "Skip for now",
          onPress: async () => {
            await finish();
            router.replace("/(caregiver-tabs)" as any);
          },
        },
      ],
    );
  }

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

  async function handleUploadDoc(type: ApiCaregiverDocumentType) {
    const file = await pickDocument();
    if (!file) return;
    setUploadingType(type);
    uploadDoc.mutate(
      { type, idNumber: numbers[type]?.trim() || undefined, file },
      {
        onError: (e: Error) => Alert.alert("Upload failed", e.message),
        onSettled: () => setUploadingType(null),
      },
    );
  }

  async function handleNext() {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Missing name", "Enter your first and last name.");
        return;
      }
      if (!/^(?:0\d{9}|\d{9})$/.test(phone)) {
        Alert.alert("Invalid phone", "Enter a valid Ghana number (e.g. 0244123456).");
        return;
      }
      try {
        const updated = await updateAccount.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: toE164Phone(phone),
        });
        updateUser({ firstName: updated.firstName });
        setStep(1);
      } catch (err) {
        Alert.alert("Couldn't save", err instanceof Error ? err.message : "Try again");
      }
      return;
    }

    if (step === 1) {
      try {
        await updateProfile.mutateAsync({
          bio: bio.trim(),
          gender: gender ?? undefined,
          dateOfBirth: dob ?? undefined,
          serviceAreas: serviceArea.split(",").map((s) => s.trim()).filter(Boolean),
          languages,
          hasHomecareExp: hasExp,
          yearsExperience: hasExp ? parseInt(years, 10) || 0 : 0,
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        });
        setStep(2);
      } catch (err) {
        Alert.alert("Couldn't save", err instanceof Error ? err.message : "Try again");
      }
      return;
    }

    // step === 2 — submit for review
    if (!allDocsUploaded) {
      Alert.alert(
        "Upload both documents",
        "Please upload your Ghana Card and Nursing PIN card to submit.",
      );
      return;
    }
    await finish();
    router.replace("/application-submitted" as any);
  }

  async function handleBack() {
    if (step === 0) {
      // Leaving from the first step behaves like "skip" so home doesn't bounce
      // them straight back into the wizard.
      await finish();
      router.replace("/(caregiver-tabs)" as any);
      return;
    }
    setStep((s) => s - 1);
  }

  const saving = updateAccount.isPending || updateProfile.isPending;
  const nextLabel = step === 2 ? "Submit for review" : "Continue";
  const loading = !account || !profile;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-background">
        <StatusBar style="dark" />

        {/* Header: back, progress, skip */}
        <View style={{ paddingTop: top + 8, paddingHorizontal: 20, paddingBottom: 8 }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
              Caregiver setup
            </Text>
            <Pressable onPress={skip} hitSlop={12}>
              <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "600" }}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Progress segments */}
          <View className="flex-row mt-4" style={{ gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: i <= step ? GREEN : "#e5e7eb",
                }}
              />
            ))}
          </View>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
            Step {step + 1} of 3 — {STEP_SUBTITLES[step]}
          </Text>
          <Text className="text-foreground font-bold" style={{ fontSize: 22, marginTop: 4 }}>
            {STEP_TITLES[step]}
          </Text>
        </View>

        {loading ? (
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
              {/* ─── Step 1: personal details ─── */}
              {step === 0 && (
                <>
                  <Label>Your details</Label>
                  <View className="flex-row" style={{ gap: 12 }}>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First name"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="words"
                      maxFontSizeMultiplier={1.2}
                      style={INPUT_STYLE}
                    />
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last name"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="words"
                      maxFontSizeMultiplier={1.2}
                      style={INPUT_STYLE}
                    />
                  </View>
                  <View
                    className="flex-row items-center rounded-full px-4"
                    style={{ marginTop: 12, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
                  >
                    <Ionicons name="call-outline" size={18} color="#6b7280" />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="0244123456"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      maxFontSizeMultiplier={1.2}
                      style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 14, color: "#111827" }}
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
                        style={{ paddingVertical: 14, marginLeft: 8, fontSize: 14 }}
                        numberOfLines={1}
                      >
                        {account.email}
                      </Text>
                      <Ionicons name="lock-closed" size={15} color="#9ca3af" />
                    </View>
                  ) : null}
                </>
              )}

              {/* ─── Step 2: profile setup ─── */}
              {step === 1 && (
                <>
                  <View className="items-center mt-4">
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

                  <Label>Gender</Label>
                  <GenderPicker value={gender} onChange={setGender} />

                  <Label>Date of birth</Label>
                  <DateOfBirthField initialIso={dob} onChange={setDob} />

                  <Label>Short bio</Label>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell families about your experience and the care you provide…"
                    placeholderTextColor="#9ca3af"
                    multiline
                    maxFontSizeMultiplier={1.2}
                    style={{
                      minHeight: 100,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      backgroundColor: "#f9fafb",
                      borderRadius: 16,
                      padding: 14,
                      fontSize: 14,
                      color: "#111827",
                      textAlignVertical: "top",
                    }}
                  />

                  <Label>Location / service area</Label>
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

                  <Label>Languages spoken</Label>
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
                            style={{ fontSize: 13, fontWeight: "600", color: active ? "#ffffff" : "#6b7280" }}
                          >
                            {lang}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Label>Experience</Label>
                  <Text className="text-foreground" style={{ fontSize: 14, marginBottom: 10 }}>
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
                            style={{ fontSize: 14, fontWeight: "700", color: active ? "#15803d" : "#6b7280" }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {hasExp && (
                    <>
                      <Label>Years of experience</Label>
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
                          style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 14, color: "#111827" }}
                        />
                        <Text className="text-muted" style={{ fontSize: 13 }}>
                          years
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}

              {/* ─── Step 3: credentials ─── */}
              {step === 2 && (
                <>
                  <Text className="text-muted" style={{ fontSize: 13, lineHeight: 19, marginTop: 8 }}>
                    Accepted: JPG, PNG or PDF — max 5 MB each. Your documents are
                    stored securely and reviewed by our team.
                  </Text>
                  {DOCS.map((doc) => {
                    const current = docByType(doc.type);
                    const busy = uploadingType === doc.type && uploadDoc.isPending;
                    const meta = current ? docStatusMeta(current.status) : null;
                    return (
                      <View key={doc.type} style={{ marginTop: 18 }}>
                        <View
                          className="flex-row items-center rounded-full px-4 mb-3"
                          style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
                        >
                          <Ionicons name={doc.icon} size={18} color="#6b7280" />
                          <TextInput
                            value={numbers[doc.type] ?? ""}
                            onChangeText={(t) =>
                              setNumbers((prev) => ({ ...prev, [doc.type]: t }))
                            }
                            placeholder={
                              doc.type === "GHANA_CARD" ? "Ghana Card PIN (GHA-…)" : "NMC PIN"
                            }
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="characters"
                            maxFontSizeMultiplier={1.2}
                            style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 14, color: "#111827" }}
                          />
                        </View>
                        <Pressable
                          onPress={() => handleUploadDoc(doc.type)}
                          disabled={busy}
                          className="flex-row items-center rounded-2xl p-4"
                          style={{
                            borderWidth: 1,
                            borderColor: current ? "#bbf7d0" : "#e5e7eb",
                            borderStyle: current ? "solid" : "dashed",
                            backgroundColor: current ? "#f0fdf4" : "#ffffff",
                          }}
                        >
                          <View
                            className="w-11 h-11 rounded-xl items-center justify-center"
                            style={{ backgroundColor: current ? "#dcfce7" : "#eff6ff" }}
                          >
                            <Ionicons
                              name={current ? "document-text" : "add"}
                              size={20}
                              color={current ? "#16a34a" : "#2563eb"}
                            />
                          </View>
                          <View className="flex-1 ml-3">
                            <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
                              {doc.title}
                            </Text>
                            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                              {current
                                ? current.fileName ?? "Uploaded"
                                : "Tap to upload · JPG, PNG or PDF"}
                            </Text>
                          </View>
                          {busy ? (
                            <ActivityIndicator color="#16a34a" />
                          ) : current && meta ? (
                            <View className="rounded-full px-2 py-1" style={{ backgroundColor: meta.bg }}>
                              <Text className="font-semibold" style={{ fontSize: 10, color: meta.color }}>
                                {meta.label}
                              </Text>
                            </View>
                          ) : (
                            <Ionicons name="cloud-upload-outline" size={20} color="#2563eb" />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}

                  <View
                    className="flex-row rounded-2xl p-4 mt-6"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
                    <Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
                      Documents are reviewed within 1–2 business days. You&apos;ll
                      be notified by SMS and email once verified.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View
              className="bg-white px-5 pt-3"
              style={{ paddingBottom: bottom + 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}
            >
              <Pressable
                onPress={handleNext}
                disabled={saving}
                className="rounded-2xl items-center justify-center py-4 flex-row"
                style={{ backgroundColor: saving ? "#9ca3af" : "#1e3a8a", gap: 8 }}
              >
                {saving && <ActivityIndicator color="#ffffff" />}
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                  {nextLabel}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
