import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PushRegistrar } from "@/components/PushRegistrar";
import { AuthProvider } from "@/contexts/AuthContext";

// Cap how much the device's system font/display size can enlarge text, so an
// enlarged Android font setting can't blow text past fixed-size containers and
// clip it. Applies app-wide to any Text/TextInput that doesn't set its own.
type WithDefaults = { defaultProps?: Record<string, unknown> };
const textDefaults = Text as unknown as WithDefaults;
const inputDefaults = TextInput as unknown as WithDefaults;
textDefaults.defaultProps = {
  ...(textDefaults.defaultProps ?? {}),
  maxFontSizeMultiplier: 1.2,
};
inputDefaults.defaultProps = {
  ...(inputDefaults.defaultProps ?? {}),
  maxFontSizeMultiplier: 1.2,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PushRegistrar />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
