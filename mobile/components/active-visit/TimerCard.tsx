import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  durationHrs: number;
  onEndVisit: () => void;
  /** When the visit actually started (from the backend), if known. */
  startedAt?: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function TimerCard({ durationHrs, onEndVisit, startedAt: startedAtIso }: Props) {
  // Anchor the timer to the backend start time when known, so it stays
  // accurate if the nurse leaves and reopens the visit.
  const [startedAt] = useState(() =>
    startedAtIso ? new Date(startedAtIso) : new Date(),
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const totalSeconds = durationHrs * 3600;
  const percent = Math.min(Math.round((elapsed / totalSeconds) * 100), 100);
  const endsAt = new Date(startedAt.getTime() + totalSeconds * 1000);

  return (
    <View className="rounded-2xl p-5" style={{ backgroundColor: "#0f2461" }}>
      {/* Status + end button */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="rounded-full mr-2"
            style={{ width: 8, height: 8, backgroundColor: "#4ade80" }}
          />
          <Text style={{ color: "#e2e8f0", fontSize: 13, fontWeight: "500" }}>
            Visit in progress
          </Text>
        </View>
        <Pressable
          onPress={onEndVisit}
          className="rounded-full px-4 py-2"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}
        >
          <Text className="text-white font-semibold" style={{ fontSize: 13 }}>
            End visit
          </Text>
        </Pressable>
      </View>

      {/* Elapsed time */}
      <Text
        className="text-white font-bold"
        style={{ fontSize: 40, marginTop: 14, fontVariant: ["tabular-nums"] }}
      >
        {formatElapsed(elapsed)}
      </Text>
      <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
        Started at {formatClock(startedAt)} · Scheduled for {durationHrs} hrs
      </Text>

      {/* Progress bar */}
      <View
        className="rounded-full mt-4"
        style={{ height: 6, backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <View
          className="rounded-full"
          style={{ height: 6, width: `${percent}%`, backgroundColor: "#4ade80" }}
        />
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Text style={{ color: "#94a3b8", fontSize: 11 }}>
          {formatClock(startedAt)}
        </Text>
        <Text style={{ color: "#e2e8f0", fontSize: 11, fontWeight: "600" }}>
          {percent}% complete
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 11 }}>
          {formatClock(endsAt)}
        </Text>
      </View>
    </View>
  );
}
