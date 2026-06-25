import { Text, View } from "react-native";

// The post-subscription journey (Steps 3–4 of the care journey), shown on the
// checkout and confirmation screens so families know what to expect next.
const STEPS = [
  {
    title: "We match your care team",
    detail:
      "A dedicated nurse, two backup nurses and a Care Coordinator are assigned to your case.",
  },
  {
    title: "Your Coordinator reaches out",
    detail: "They confirm details, answer questions and schedule the first visit.",
  },
  {
    title: "Initial home visit & care plan",
    detail:
      "Your nurse and Coordinator assess needs at home and build a personalized care plan.",
  },
];

export function NextStepsCard() {
  return (
    <View
      className="bg-card rounded-2xl p-4"
      style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      {STEPS.map((step, index) => (
        <View
          key={step.title}
          className="flex-row"
          style={{ marginTop: index === 0 ? 0 : 16 }}
        >
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "700" }}>
              {index + 1}
            </Text>
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-foreground font-semibold" style={{ fontSize: 14 }}>
              {step.title}
            </Text>
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 2, lineHeight: 18 }}>
              {step.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
