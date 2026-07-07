import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { MoodSelector, type Mood } from "@/components/care-report/MoodSelector";
import { ToggleRow } from "@/components/care-report/ToggleRow";
import { VitalsGrid, type Vitals } from "@/components/care-report/VitalsGrid";
import { avatarColor } from "@/lib/avatar";
import { useEditLog, useSubmitLog, useVisit } from "@/hooks/useVisits";
import type { ApiPatientMood } from "@/services/visit.service";

const MOOD_MAP: Record<Mood, ApiPatientMood> = {
  Poor: "POOR",
  Low: "LOW",
  Good: "GOOD",
  Great: "GREAT",
  Excellent: "EXCELLENT",
};

const MOOD_FROM_API: Record<ApiPatientMood, Mood> = {
  POOR: "Poor",
  LOW: "Low",
  GOOD: "Good",
  GREAT: "Great",
  EXCELLENT: "Excellent",
};

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
  const { id, notes, quickLog } = useLocalSearchParams<{
    id: string;
    notes?: string;
    quickLog?: string;
  }>();
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();

  const { data: visit, isLoading } = useVisit(id);
  const submitLog = useSubmitLog(id ?? "");
  const editLog = useEditLog(id ?? "");
  const editing = !!visit?.log;
  const pending = submitLog.isPending || editLog.isPending;

  // Care notes typed during the active visit prefill the summary. Params can
  // land a tick after mount, so sync once when they first arrive (without
  // clobbering anything the caregiver has since typed).
  const [summary, setSummary] = useState(notes ?? "");
  const prefilled = useRef(Boolean(notes));
  useEffect(() => {
    if (!prefilled.current && notes) {
      prefilled.current = true;
      setSummary((current) => (current ? current : notes));
    }
  }, [notes]);
  const [observations, setObservations] = useState("");
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: "",
    bloodGlucose: "",
    heartRate: "",
    temperature: "",
  });
  const [medications, setMedications] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [followUp, setFollowUp] = useState(false);
  const [escalation, setEscalation] = useState(false);

  // Edit mode: seed the form from the existing log once it loads.
  const seededFromLog = useRef(false);
  useEffect(() => {
    const l = visit?.log;
    if (!l || seededFromLog.current) return;
    seededFromLog.current = true;
    setSummary(l.summary);
    setObservations(l.observations ?? "");
    setVitals({
      bloodPressure: l.bloodPressure ?? "",
      bloodGlucose: l.bloodGlucose ?? "",
      heartRate: l.heartRate ?? "",
      temperature: l.temperature ?? "",
    });
    setMedications(l.medicationsGiven.join(", "));
    setMood(l.mood ? MOOD_FROM_API[l.mood] : null);
    setFollowUp(l.followUpRecommended);
    setEscalation(l.escalationNeeded);
  }, [visit]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  if (!visit) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-muted">Visit not found.</Text>
      </View>
    );
  }

  const client = visit.client;
  const time = new Date(visit.scheduledFor).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  function handleSubmit() {
    if (!summary.trim()) {
      Alert.alert("Missing summary", "Please describe what you did during the visit.");
      return;
    }
    if (!observations.trim()) {
      Alert.alert("Missing observations", "Please record your observations of the patient.");
      return;
    }
    if (!mood) {
      Alert.alert("Missing mood", "Please select how the patient was during the visit.");
      return;
    }

    const medicationsGiven = medications
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const quickLogItems =
      editing && visit?.log
        ? visit.log.quickLog
        : (quickLog ?? "")
            .split(",")
            .map((q) => q.trim())
            .filter(Boolean);

    const payload = {
      summary: summary.trim(),
      observations: observations.trim() || undefined,
      bloodPressure: vitals.bloodPressure.trim() || undefined,
      bloodGlucose: vitals.bloodGlucose.trim() || undefined,
      heartRate: vitals.heartRate.trim() || undefined,
      temperature: vitals.temperature.trim() || undefined,
      medicationsGiven,
      quickLog: quickLogItems,
      mood: MOOD_MAP[mood],
      followUpRecommended: followUp,
      escalationNeeded: escalation,
    };

    const action = editing ? editLog : submitLog;
    action.mutate(payload, {
      onSuccess: () =>
        Alert.alert(
          editing ? "Report updated" : "Report submitted",
          editing
            ? "Your revised report has been resubmitted to your Care Coordinator for review."
            : "The care report has been shared with your Care Coordinator and saved to the patient's care record.",
          [
            {
              text: "Done",
              onPress: () =>
                editing
                  ? router.back()
                  : router.replace("/(caregiver-tabs)" as any),
            },
          ],
        ),
      onError: (err: Error) =>
        Alert.alert(editing ? "Couldn't save" : "Couldn't submit", err.message),
    });
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
            {editing ? "Edit care report" : "Care report"}
          </Text>
          <Text className="text-muted" style={{ fontSize: 13 }}>
            {editing ? "Editing" : "Draft"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Changes requested by the coordinator */}
          {visit.log?.changesRequested && (
            <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#fef2f2" }}>
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text className="font-bold" style={{ color: "#dc2626", fontSize: 13, marginLeft: 6 }}>
                  Changes requested
                </Text>
              </View>
              {visit.log.reviewNotes.length > 0 ? (
                visit.log.reviewNotes.map((n, i) => (
                  <View key={i} className="flex-row mt-1.5" style={{ gap: 6 }}>
                    <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "700" }}>
                      {i + 1}.
                    </Text>
                    <Text style={{ color: "#b91c1c", fontSize: 13, lineHeight: 19, flex: 1 }}>
                      {n}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#b91c1c", fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                  Your Care Coordinator asked you to revise this report.
                </Text>
              )}
            </View>
          )}

          {/* Patient banner */}
          <View
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: "#0f2461" }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor(client.name) }}
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
                {time} · {visit.durationHrs} hrs
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: "rgba(22, 163, 74, 0.3)" }}
            >
              <Text style={{ color: "#4ade80", fontSize: 11, fontWeight: "600" }}>
                Completing
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
                Observations <Text style={{ color: "#dc2626" }}>*</Text>
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
            <View
              className="bg-card rounded-2xl p-4"
              style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
            >
              <TextInput
                value={medications}
                onChangeText={setMedications}
                placeholder="List medications given, comma separated (e.g. Amlodipine 5mg, Metformin 500mg)"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="text-foreground"
                style={{ fontSize: 14, lineHeight: 21, minHeight: 48, padding: 0 }}
              />
            </View>
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
              subtitle="Suggest another visit to the Coordinator"
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
              This report is sent to your Care Coordinator for review and stored in
              the patient&apos;s care record.
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
            disabled={pending}
            className="rounded-full items-center justify-center py-4 flex-row"
            style={{ backgroundColor: pending ? "#9ca3af" : "#1e3a8a", gap: 8 }}
          >
            {pending && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
              {editing ? "Save changes" : "Submit report"}
            </Text>
          </Pressable>
          <Text className="text-muted text-center" style={{ fontSize: 11, marginTop: 8 }}>
            {editing
              ? "You can edit until your Coordinator reviews it"
              : "You can revise this until your Coordinator reviews it"}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
