import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCaregiverDocuments,
  useUploadCaregiverDocument,
} from "@/hooks/useCaregiverProfile";
import { pickDocument } from "@/lib/pick";
import type {
  ApiCaregiverDocumentType,
  ApiDocumentStatus,
} from "@/services/caregiver.service";

type DocMeta = {
  type: ApiCaregiverDocumentType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  numberLabel: string;
  numberPlaceholder: string;
};

const DOCS: DocMeta[] = [
  {
    type: "GHANA_CARD",
    title: "Ghana Card / National ID",
    icon: "card-outline",
    numberLabel: "Ghana Card PIN",
    numberPlaceholder: "GHA-XXXXXXXXX-X",
  },
  {
    type: "PIN_CARD",
    title: "Nursing & Midwifery PIN card",
    icon: "ribbon-outline",
    numberLabel: "NMC PIN",
    numberPlaceholder: "e.g. PIN123456",
  },
];

function statusMeta(status: ApiDocumentStatus) {
  switch (status) {
    case "VERIFIED":
      return { label: "Verified", color: "#16a34a", bg: "#f0fdf4" };
    case "REJECTED":
      return { label: "Rejected", color: "#dc2626", bg: "#fef2f2" };
    default:
      return { label: "Under review", color: "#d97706", bg: "#fffbeb" };
  }
}

export default function CaregiverCredentialsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: documents, isLoading } = useCaregiverDocuments();
  const uploadDoc = useUploadCaregiverDocument();

  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] =
    useState<ApiCaregiverDocumentType | null>(null);

  // Seed ID numbers from what's already stored.
  useEffect(() => {
    if (!documents) return;
    const seed: Record<string, string> = {};
    for (const d of documents) if (d.idNumber) seed[d.type] = d.idNumber;
    setNumbers((prev) => ({ ...seed, ...prev }));
  }, [documents]);

  const docByType = (t: ApiCaregiverDocumentType) =>
    (documents ?? []).find((d) => d.type === t);

  const uploadedCount = DOCS.filter((d) => docByType(d.type)).length;
  const allUploaded = uploadedCount === DOCS.length;

  async function handleUpload(type: ApiCaregiverDocumentType) {
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

  return (
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
          Credentials
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Text className="text-muted" style={{ fontSize: 13, lineHeight: 19, marginTop: 4 }}>
          Upload your Ghana Card and Nursing & Midwifery PIN card. Accepted:
          JPG, PNG or PDF — max 5 MB each. Your documents are stored securely and
          reviewed by our team.
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#16a34a" style={{ marginTop: 32 }} />
        ) : (
          DOCS.map((doc) => {
            const current = docByType(doc.type);
            const busy = uploadingType === doc.type && uploadDoc.isPending;
            const meta = current ? statusMeta(current.status) : null;
            return (
              <View key={doc.type} style={{ marginTop: 22 }}>
                <Text
                  className="text-muted font-semibold"
                  style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}
                >
                  {doc.numberLabel.toUpperCase()}
                </Text>
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
                    placeholder={doc.numberPlaceholder}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    maxFontSizeMultiplier={1.2}
                    style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 14, color: "#111827" }}
                  />
                </View>

                {/* Upload card */}
                <Pressable
                  onPress={() => handleUpload(doc.type)}
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
                    {current?.status === "REJECTED" && current.reviewNote ? (
                      <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 3 }}>
                        {current.reviewNote}
                      </Text>
                    ) : null}
                  </View>
                  {busy ? (
                    <ActivityIndicator color="#16a34a" />
                  ) : current && meta ? (
                    <View
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: meta.bg }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ fontSize: 10, color: meta.color }}
                      >
                        {meta.label}
                      </Text>
                    </View>
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#2563eb" />
                  )}
                </Pressable>
                {current ? (
                  <Pressable onPress={() => handleUpload(doc.type)} hitSlop={8}>
                    <Text
                      style={{ color: "#2563eb", fontSize: 12.5, fontWeight: "600", marginTop: 8, marginLeft: 4 }}
                    >
                      Replace file
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}

        {/* Review info */}
        <View
          className="flex-row rounded-2xl p-4 mt-6"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
          <Text
            style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}
          >
            Documents are reviewed within 1–2 business days. You&apos;ll be
            notified by SMS and email once verified.
          </Text>
        </View>

        {allUploaded && (
          <Pressable
            onPress={() => router.push("/application-submitted" as any)}
            className="rounded-2xl items-center justify-center py-4 mt-4"
            style={{ backgroundColor: "#16a34a" }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 15 }}>
              View application status
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
