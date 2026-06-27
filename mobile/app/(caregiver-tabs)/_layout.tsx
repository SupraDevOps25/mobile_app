import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

type IconProps = { focused: boolean; color: string; size: number };

function icon(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  function TabBarIcon({ focused, color, size }: IconProps) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  }
  return TabBarIcon;
}

export default function CaregiverTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: icon("home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: icon("calendar", "calendar-outline"),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: "Visits",
          tabBarIcon: icon("medkit", "medkit-outline"),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: icon("cash", "cash-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: icon("person", "person-outline"),
        }}
      />
      {/* Hidden from the tab bar — opened via navigation with ?id=… */}
      <Tabs.Screen name="active-visit" options={{ href: null }} />
      <Tabs.Screen name="availability" options={{ href: null }} />
    </Tabs>
  );
}
