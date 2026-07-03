import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SUPPORT } from "@/constants/support";

type Faq = { q: string; a: string };
type FaqSection = { title: string; items: Faq[] };

const SECTIONS: FaqSection[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "How does Supracarer work?",
        a: "You choose a care package for your loved one. We then match a dedicated care team — a lead nurse with backups — and a Care Coordinator who plans visits and stays in touch with you throughout.",
      },
      {
        q: "What care packages are available?",
        a: "Wellness Visits, Daily Assist, Extended Assist and Live-In Care. Each differs in how often a nurse visits and for how long. You can compare them on the home screen.",
      },
    ],
  },
  {
    title: "Your care team",
    items: [
      {
        q: "Who is my Care Coordinator?",
        a: "A dedicated coordinator assigned to your case. They schedule visits, review daily care logs, and are your main point of contact — you reach the team through them.",
      },
      {
        q: "Can I choose my nurse?",
        a: "Nurses are matched on experience, availability, proximity and reliability. If you have concerns, you can ask for a different nurse when you renew — your coordinator stays the same for continuity.",
      },
      {
        q: "What if my nurse is unavailable?",
        a: "Backup nurses are assigned to every case. If the lead nurse can't attend, your coordinator arranges cover so care continues without a gap.",
      },
    ],
  },
  {
    title: "Visits & daily care",
    items: [
      {
        q: "How do visits work?",
        a: "Your nurse starts the visit when they arrive, delivers the agreed care, and submits a daily report. Your Care Coordinator reviews every report.",
      },
      {
        q: "Where can I see visit reports?",
        a: "Open the Care tab to see your care plan, upcoming and recent visits, and their status.",
      },
    ],
  },
  {
    title: "Billing & payments",
    items: [
      {
        q: "When am I charged?",
        a: "Billing is post-paid. At the end of each care month your coordinator issues an invoice, which you can pay in the app.",
      },
      {
        q: "How do I pay an invoice?",
        a: "Open Profile > Payment methods or the Invoices screen. You can pay by card or mobile money through Paystack. Your method is saved securely for next time.",
      },
      {
        q: "Is my card information safe?",
        a: "Yes. Card details are handled entirely by Paystack's secure checkout and are never stored on our servers — we only keep a secure token to reuse.",
      },
    ],
  },
  {
    title: "Managing your subscription",
    items: [
      {
        q: "How do I renew my care?",
        a: "When your care month completes, you'll be asked to renew. You can continue with the same team, or request a re-match if you'd prefer a different nurse.",
      },
      {
        q: "How do I cancel?",
        a: "You can end the service from your care plan at any time. Your past care history stays available in the app for your records.",
      },
    ],
  },
  {
    title: "Your account",
    items: [
      {
        q: "How do I update my details?",
        a: "Go to Profile > Personal information to update your name and phone number.",
      },
      {
        q: "How do I save an address?",
        a: "Go to Profile > Saved addresses. You can enter one manually or tap 'Use my current location' to fill it from your GPS.",
      },
    ],
  },
];

function FaqRow({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center px-4 py-4"
      >
        <Text className="flex-1 text-foreground font-semibold" style={{ fontSize: 14 }}>
          {item.q}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color="#9ca3af"
        />
      </Pressable>
      {open && (
        <Text
          className="text-muted px-4 pb-4"
          style={{ fontSize: 13, lineHeight: 20, marginTop: -4 }}
        >
          {item.a}
        </Text>
      )}
    </View>
  );
}

export default function HelpCentreScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter(
        (it) =>
          it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
      ),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Help centre
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        {/* Search */}
        <View
          className="flex-row items-center border rounded-full px-4 mt-2 mb-4"
          style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
        >
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search help topics"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-foreground"
            style={{ fontSize: 14, paddingVertical: 12, marginLeft: 8 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#c4c9d1" />
            </Pressable>
          )}
        </View>

        {sections.length === 0 ? (
          <View className="items-center" style={{ paddingTop: 40 }}>
            <Ionicons name="search-outline" size={28} color="#9ca3af" />
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 10 }}>
              No results for &ldquo;{query}&rdquo;. Try different words, or contact
              support below.
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} className="mb-4">
              <Text
                className="text-muted font-semibold"
                style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}
              >
                {section.title.toUpperCase()}
              </Text>
              <View
                className="bg-card rounded-2xl overflow-hidden"
                style={{ borderWidth: 1, borderColor: "#f3f4f6" }}
              >
                {section.items.map((item, i) => (
                  <View key={item.q}>
                    <FaqRow item={item} />
                    {i < section.items.length - 1 && (
                      <View style={{ height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 16 }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Contact CTA */}
        <View className="rounded-2xl p-4 mt-1" style={{ backgroundColor: "#eff6ff" }}>
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            Still need help?
          </Text>
          <Text className="text-muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 19 }}>
            Our support team is here for you.
          </Text>
          <View className="flex-row mt-3" style={{ gap: 10 }}>
            <Pressable
              onPress={() => Linking.openURL(`mailto:${SUPPORT.email}`)}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <Ionicons name="mail-outline" size={16} color="#ffffff" />
              <Text className="text-white font-semibold" style={{ fontSize: 13, marginLeft: 6 }}>
                Email us
              </Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(`tel:${SUPPORT.phone}`)}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3"
              style={{ backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#c7d2fe" }}
            >
              <Ionicons name="call-outline" size={16} color="#1e3a8a" />
              <Text style={{ color: "#1e3a8a", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>
                Call us
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
