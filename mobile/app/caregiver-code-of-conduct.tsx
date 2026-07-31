import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GREEN = "#16a34a";
const NAVY = "#1e3a8a";

export default function CaregiverCodeOfConductScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { lastUpdated, intro, sections, footer } = codeOfConductData;

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
          Code of conduct
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 32 }}
      >
        <Text className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
          Last updated: {lastUpdated}
        </Text>
        <Text className="text-foreground" style={{ fontSize: 14, lineHeight: 21, marginTop: 10 }}>
          {intro}
        </Text>

        {sections.map((section) => (
          <View
            key={section.id}
            className="rounded-2xl p-4 mt-3"
            style={{ borderWidth: 1, borderColor: "#eef0f2", backgroundColor: "#ffffff" }}
          >
            <View className="flex-row items-center" style={{ marginBottom: 8 }}>
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 26, height: 26, backgroundColor: "#f0fdf4" }}
              >
                <Text style={{ color: GREEN, fontSize: 13, fontWeight: "800" }}>
                  {section.id}
                </Text>
              </View>
              <Text className="text-foreground font-bold" style={{ fontSize: 15, marginLeft: 10 }}>
                {section.title}
              </Text>
            </View>

            {"items" in section && section.items ? (
              section.items.map((item, i) => (
                <View key={i} className="flex-row items-start" style={{ marginTop: i === 0 ? 2 : 8 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: GREEN,
                      marginTop: 7,
                      marginRight: 10,
                    }}
                  />
                  <Text className="text-muted flex-1" style={{ fontSize: 13.5, lineHeight: 20 }}>
                    {item}
                  </Text>
                </View>
              ))
            ) : "content" in section && section.content ? (
              <Text className="text-muted" style={{ fontSize: 13.5, lineHeight: 20 }}>
                {section.content}
              </Text>
            ) : null}
          </View>
        ))}

        {/* Footer */}
        <View className="rounded-2xl p-4 mt-5" style={{ backgroundColor: "#eff6ff" }}>
          <Text style={{ color: "#1d4ed8", fontSize: 12.5, lineHeight: 18 }}>
            {footer.text}
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`mailto:${footer.email}`)}
            hitSlop={8}
            style={{ marginTop: 4 }}
          >
            <Text style={{ color: NAVY, fontSize: 13, fontWeight: "700" }}>
              {footer.email}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export const codeOfConductData = {
  lastUpdated: "December 10, 2025",
  intro:
    'At Supracarer, we are committed to providing safe, professional, and human-centered care. All Healthcare Professionals ("Care Providers") who use our platform must adhere to the following Code of Conduct.',
  sections: [
    {
      id: 1,
      title: "Professionalism",
      items: [
        "Provide care with respect, dignity, and compassion.",
        "Maintain a clean, professional appearance.",
        "Arrive on time and communicate promptly if delays occur.",
      ],
    },
    {
      id: 2,
      title: "Safety & Compliance",
      items: [
        "Follow all legal, ethical, and professional standards of care.",
        "Use safe practices when assisting clients.",
        "Report any accidents, concerns, or emergencies immediately.",
      ],
    },
    {
      id: 3,
      title: "Honesty & Integrity",
      items: [
        "Provide accurate information in your Healthcare Professional profile.",
        "Do not falsify qualifications, identity, or certifications.",
        "Respect client privacy and confidentiality at all times.",
      ],
    },
    {
      id: 4,
      title: "Respect for Clients",
      items: [
        "Treat all clients equally regardless of age, gender, religion, or background.",
        "Honor client boundaries and cultural preferences.",
        "Never engage in harassment, discrimination, or abuse of any kind.",
      ],
    },
    {
      id: 5,
      title: "Data Protection",
      items: [
        "Do not share client information outside the scope of your duties.",
        "Secure all digital and physical records related to client care.",
      ],
    },
    {
      id: 6,
      title: "Prohibited Actions",
      items: [
        "Theft or misuse of client property",
        "Providing medical services outside your certification",
        "Substance use during care assignments",
        "Soliciting additional payments outside the platform",
      ],
    },
    {
      id: 7,
      title: "Termination of Access",
      content:
        "Violation of this code may result in suspension or removal from Supracarer.",
    },
  ],
  footer: {
    text: "For questions about our Code of Conduct, please contact us:",
    email: "support@supracarer.app",
  },
};
