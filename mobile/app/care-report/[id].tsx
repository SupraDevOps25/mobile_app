import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MedicationsSection } from "@/components/care-report/MedicationsSection";
import { MoodSelector, type Mood } from "@/components/care-report/MoodSelector";
import { ToggleRow } from "@/components/care-report/ToggleRow";
import { VitalsGrid, type Vitals } from "@/components/care-report/VitalsGrid";
import { getNurseVisit } from "@/constants/nurse-cases";

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold mb-2"
      style={{ fontSize: 11, letterSpacing: 1 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function NotesInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#f3f4f6" }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline
        textAlignVertical="top"
        className="text-foreground"
        style={{ fontSize: 14, lineHeight: 21, minHeight: 70, padding: 0 }}
      />
    </View>
  );
}

export default function CareReportScreen() {
  const { id, notes } = useLocalSearchParams<{ id: string; notes?: string }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const data = getNurseVisit(id);

  // Care notes typed during the active visit prefill the summary
  const [summary, setSummary] = useState(notes ?? "");
  const [observations, setObservations] = useState("");
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: "",
    bloodGlucose: "",
    heartRate: "",
    temperature: "",
  });
  const [givenMeds, setGivenMeds] = useState<string[]>(
    data ? data.nurseCase.client.medications.map((m) => m.id) : [],
  );
  const [mood, setMood] = useState<Mood | null>(null);
  const [followUp, setFollowUp] = useState(true);
  const [escalation, setEscalation] = useState(false);

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Visit not found.</Text>
      </View>
    );
  }

  const { visit, nurseCase } = data;
  const client = nurseCase.client;

  function toggleMed(medId: string) {
    setGivenMeds((prev) =>
      prev.includes(medId) ? prev.filter((x) => x !== medId) : [...prev, medId],
    );
  }

  function handleSubmit() {
    if (!summary.trim()) {
      Alert.alert("Missing summary", "Please describe what you did during the visit.");
      return;
    }
    if (!mood) {
      Alert.alert("Missing mood", "Please select how the patient was during the visit.");
      return;
    }
    Alert.alert(
      "Submit report",
      "You won't be able to edit the report after submission. Submit now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => {
            Alert.alert(
              "Report submitted",
              "The care report has been shared with the family and saved to the patient's care record.",
              [
                {
                  text: "Done",
                  onPress: () => router.replace("/(caregiver-tabs)" as any),
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1" style={{ backgroundColor: "#f8fafc" }}>
        {/* Header */}
        <View
          className="flex-row items-center px-5 pb-4 bg-white"
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
          <Text className="flex-1 text-foreground font-bold" style={{ fontSize: 18 }}>
            Care report
          </Text>
          <Text className="text-muted" style={{ fontSize: 13 }}>
            Draft
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient banner */}
          <View
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: "#0f2461" }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: client.avatarColor }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                {client.initials}
              </Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                {client.name}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                {nurseCase.careType} · {visit.time} · {visit.durationHrs} hrs
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: "rgba(22, 163, 74, 0.3)" }}
            >
              <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "600" }}>
                Completed
              </Text>
            </View>
          </View>

          {/* Visit summary */}
          <View className="mt-5">
            <SectionLabel title="Visit summary" />
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <Text className="text-foreground font-semibold mb-2" style={{ fontSize: 13 }}>
                What did you do during this visit?
              </Text>
              <NotesInput
                value={summary}
                onChangeText={setSummary}
                placeholder="e.g. Administered morning medications, monitored blood pressure and glucose levels…"
              />
              <Text className="text-foreground font-semibold mb-2" style={{ fontSize: 13 }}>
                Observations
              </Text>
              <NotesInput
                value={observations}
                onChangeText={setObservations}
                placeholder="e.g. Patient was cooperative and in stable condition…"
              />
            </View>
          </View>

          {/* Vitals */}
          <View className="mt-5">
            <SectionLabel title="Vitals recorded" />
            <VitalsGrid
              vitals={vitals}
              onChange={(key, value) => setVitals((prev) => ({ ...prev, [key]: value }))}
            />
          </View>

          {/* Medications */}
          <View className="mt-5">
            <SectionLabel title="Medications administered" />
            <MedicationsSection
              medications={client.medications}
              given={givenMeds}
              onToggle={toggleMed}
            />
          </View>

          {/* Patient mood */}
          <View className="mt-5">
            <SectionLabel title="Patient mood" />
            <Text className="text-foreground font-semibold mb-3" style={{ fontSize: 13 }}>
              How was the patient during this visit?
            </Text>
            <MoodSelector selected={mood} onSelect={setMood} />
          </View>

          {/* Follow-up */}
          <View className="mt-5">
            <SectionLabel title="Follow-up" />
            <ToggleRow
              title="Follow-up recommended"
              subtitle="Suggest another visit to the family"
              value={followUp}
              onValueChange={setFollowUp}
            />
            <ToggleRow
              title="Escalation needed"
              subtitle="Flag for clinical review"
              value={escalation}
              onValueChange={setEscalation}
            />
          </View>

          {/* Sharing notice */}
          <View
            className="flex-row items-center rounded-xl p-3 mt-2"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
            <Text
              style={{
                color: "#1d4ed8",
                fontSize: 12,
                lineHeight: 18,
                marginLeft: 8,
                flex: 1,
              }}
            >
              This report will be shared with the patient&apos;s family and stored in
              their care record.
            </Text>
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
          <Pressable
            onPress={handleSubmit}
            className="rounded-full items-center justify-center py-4"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
              Submit report
            </Text>
          </Pressable>
          <Text className="text-muted text-center" style={{ fontSize: 11, marginTop: 8 }}>
            You won&apos;t be able to edit after submission
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
