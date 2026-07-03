import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useDeviceLocation, type ResolvedLocation } from "@/hooks/useDeviceLocation";
import type { ApiGender } from "@/services/subscription.service";

const GREEN = "#16a34a";

// ─── Age helpers ─────────────────────────────────────────────────────────────

export function ageFromIso(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// ─── Gender ──────────────────────────────────────────────────────────────────

export function GenderPicker({
  value,
  onChange,
}: {
  value: ApiGender | null;
  onChange: (g: ApiGender) => void;
}) {
  return (
    <View className="flex-row" style={{ gap: 10 }}>
      {(["MALE", "FEMALE"] as const).map((g) => {
        const active = value === g;
        return (
          <Pressable
            key={g}
            onPress={() => onChange(g)}
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
              {g === "MALE" ? "Male" : "Female"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Date of birth (day / month / year → ISO) ────────────────────────────────

function partsFromIso(iso: string | null) {
  if (!iso) return { d: "", m: "", y: "" };
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return { d: "", m: "", y: "" };
  return {
    d: String(dt.getDate()),
    m: String(dt.getMonth() + 1),
    y: String(dt.getFullYear()),
  };
}

export function DateOfBirthField({
  initialIso,
  onChange,
}: {
  initialIso: string | null;
  onChange: (iso: string | null) => void;
}) {
  const seed = partsFromIso(initialIso);
  const [day, setDay] = useState(seed.d);
  const [month, setMonth] = useState(seed.m);
  const [year, setYear] = useState(seed.y);

  function emit(d: string, m: string, y: string) {
    const dn = parseInt(d, 10);
    const mn = parseInt(m, 10);
    const yn = parseInt(y, 10);
    if (
      y.length === 4 &&
      yn > 1900 &&
      mn >= 1 &&
      mn <= 12 &&
      dn >= 1 &&
      dn <= 31
    ) {
      const iso = `${yn}-${pad2(mn)}-${pad2(dn)}`;
      const dt = new Date(iso);
      // Reject impossible dates (e.g. 31 Feb rolls over).
      if (!Number.isNaN(dt.getTime()) && dt.getDate() === dn) {
        onChange(iso);
        return;
      }
    }
    onChange(null);
  }

  const cell = {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    textAlign: "center" as const,
  };

  const iso =
    year.length === 4 && month && day
      ? (() => {
          const mn = parseInt(month, 10);
          const dn = parseInt(day, 10);
          return `${parseInt(year, 10)}-${pad2(mn)}-${pad2(dn)}`;
        })()
      : null;
  const age = ageFromIso(iso);

  return (
    <View>
      <View className="flex-row" style={{ gap: 10 }}>
        <TextInput
          value={day}
          onChangeText={(t) => {
            const v = t.replace(/[^0-9]/g, "").slice(0, 2);
            setDay(v);
            emit(v, month, year);
          }}
          placeholder="DD"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxFontSizeMultiplier={1.2}
          style={[cell, { flex: 1 }]}
        />
        <TextInput
          value={month}
          onChangeText={(t) => {
            const v = t.replace(/[^0-9]/g, "").slice(0, 2);
            setMonth(v);
            emit(day, v, year);
          }}
          placeholder="MM"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxFontSizeMultiplier={1.2}
          style={[cell, { flex: 1 }]}
        />
        <TextInput
          value={year}
          onChangeText={(t) => {
            const v = t.replace(/[^0-9]/g, "").slice(0, 4);
            setYear(v);
            emit(day, month, v);
          }}
          placeholder="YYYY"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxFontSizeMultiplier={1.2}
          style={[cell, { flex: 1.4 }]}
        />
      </View>
      {age !== null && (
        <Text className="text-muted" style={{ fontSize: 12.5, marginTop: 8, marginLeft: 4 }}>
          Age: {age}
        </Text>
      )}
    </View>
  );
}

// ─── Service area with device location ───────────────────────────────────────

export function ServiceAreaField({
  value,
  onChangeText,
  onLocated,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onLocated: (loc: ResolvedLocation) => void;
}) {
  const { getCurrent, loading } = useDeviceLocation();

  async function useLocation() {
    const loc = await getCurrent();
    if (loc) onLocated(loc);
  }

  return (
    <View>
      <Pressable
        onPress={useLocation}
        disabled={loading}
        className="flex-row items-center rounded-2xl px-4 py-3 mb-2"
        style={{ backgroundColor: "#eef2ff" }}
      >
        {loading ? (
          <ActivityIndicator color="#4f46e5" size="small" />
        ) : (
          <Ionicons name="navigate" size={18} color="#4f46e5" />
        )}
        <Text style={{ color: "#3730a3", fontSize: 13, fontWeight: "700", marginLeft: 8 }}>
          {loading ? "Getting your location…" : "Use my current location"}
        </Text>
      </Pressable>
      <View
        className="flex-row items-center rounded-full px-4"
        style={{ borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        <Ionicons name="location-outline" size={18} color="#6b7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="e.g. East Legon, Accra"
          placeholderTextColor="#9ca3af"
          maxFontSizeMultiplier={1.2}
          style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 14, color: "#111827" }}
        />
      </View>
    </View>
  );
}
