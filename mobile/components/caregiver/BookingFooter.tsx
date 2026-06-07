import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = { hourlyRate: number; caregiverId: string };

export function BookingFooter({ hourlyRate, caregiverId }: Props) {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="flex-row items-center justify-between px-6 pt-4 bg-white"
      style={{
        paddingBottom: bottom + 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
      }}
    >
      <View>
        <Text className="text-foreground font-bold" style={{ fontSize: 22 }}>
          GHC {hourlyRate}
        </Text>
        <Text className="text-muted" style={{ fontSize: 12 }}>
          per hour
        </Text>
      </View>

      <Pressable
        onPress={() => router.push(`/booking/${caregiverId}` as any)}
        className="rounded-2xl px-10 py-4 items-center justify-center"
        style={{ backgroundColor: "#1e3a8a" }}
      >
        <Text className="text-white font-bold" style={{ fontSize: 16 }}>
          Book
        </Text>
      </Pressable>
    </View>
  );
}
