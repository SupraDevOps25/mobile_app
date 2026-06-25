import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function CTABanner() {
  const router = useRouter();
  return (
    <View
      className="rounded-2xl px-5 py-5 flex-row items-center"
      style={{ backgroundColor: "#0f2460" }}
    >
      <View className="flex-1 pr-4">
        <Text className="text-white font-bold leading-6" style={{ fontSize: 15 }}>
          Personalized homecare,{"\n"}coordinated for you.
        </Text>
        <Text style={{ color: "#93c5fd", fontSize: 12, marginTop: 4 }}>
          Subscribe to a care package
        </Text>
      </View>
      <Pressable
        onPress={() => router.push("/packages" as any)}
        className="bg-white rounded-2xl px-4 py-2.5"
      >
        <Text style={{ color: "#0f2460", fontWeight: "700", fontSize: 13 }}>
          Get started
        </Text>
      </Pressable>
    </View>
  );
}
