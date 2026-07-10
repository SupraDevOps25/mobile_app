import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { ApiAssignment } from "@/services/assignment.service";

function ghs(n: number | null): string {
  return n != null ? `GHS ${n.toLocaleString()}` : "To be confirmed";
}

export function AssignmentEarningsCard({
  assignment,
}: {
  assignment: ApiAssignment;
}) {
  const isAssistant = assignment.role === "ASSISTANT";
  const isFullTime =
    assignment.packageType === "EXTENDED_ASSIST" ||
    assignment.packageType === "LIVE_IN";

  // An assistant is always on the shared rate; the lead shows the solo rate,
  // with the shared rate noted below for full-time cases where they might take
  // on a second nurse.
  const primary = isAssistant
    ? assignment.sharedPayoutGhs
    : assignment.soloPayoutGhs ?? assignment.payoutGhs;

  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#dcfce7" }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: "#dcfce7" }}
        >
          <Ionicons name="cash-outline" size={18} color="#16a34a" />
        </View>
        <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
          <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
            {isAssistant ? "You'll earn (shared rotation)" : "You'll earn"}
          </Text>
          <View>
            <Text className="text-foreground font-bold" style={{ fontSize: 22, lineHeight: 28 }}>
              {ghs(primary)}
              {primary != null && (
                <Text className="text-muted" style={{ fontSize: 13, fontWeight: "400" }}>
                  {" "}
                  /month
                </Text>
              )}
              </Text>
          </View>
        </View>
        <Text style={{ color: "#16a34a", fontSize: 12, fontWeight: "600" }}>
          Paid monthly
        </Text>
      </View>

      {/* Full-time lead: show what the pay becomes if a second nurse shares it. */}
      {!isAssistant && isFullTime && assignment.sharedPayoutGhs != null && (
        <View
          className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
          style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dcfce7" }}
        >
          <Ionicons name="people-outline" size={15} color="#0f766e" />
          <Text style={{ color: "#0f766e", fontSize: 12.5, lineHeight: 17, marginLeft: 7, flex: 1 }}>
            With a second nurse, this is shared equally —{" "}
            <Text style={{ fontWeight: "700" }}>{ghs(assignment.sharedPayoutGhs)}</Text>{" "}
            each per month.
          </Text>
        </View>
      )}
    </View>
  );
}
