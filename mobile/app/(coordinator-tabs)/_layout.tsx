import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconProps = { focused: boolean; color: string; size: number };

function icon(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  function TabBarIcon({ focused, color, size }: IconProps) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  }
  return TabBarIcon;
}

export default function CoordinatorTabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0d9488",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: icon("home", "home-outline") }}
      />
      <Tabs.Screen
        name="cases"
        options={{ title: "Cases", tabBarIcon: icon("people", "people-outline") }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: "Reviews",
          tabBarIcon: icon("document-text", "document-text-outline"),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: icon("chatbubble", "chatbubble-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: icon("person", "person-outline") }}
      />
    </Tabs>
  );
}
