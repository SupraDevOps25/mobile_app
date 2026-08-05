import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { ChatThread } from "@/components/messages/ChatThread";
import { useFamilyThread } from "@/hooks/useMessages";

export default function MessagesScreen() {
  const { top } = useSafeAreaInsets();
  const { data: thread, isLoading } = useFamilyThread();
  const peer = thread?.peer ?? null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center" style={{ paddingTop: top }}>
        <ActivityIndicator color="#1e3a8a" />
      </View>
    );
  }

  // No coordinator assigned to an active plan yet — nothing to chat with.
  if (!thread || !peer) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: top + 16 }}>
        <View className="px-5 pb-2">
          <Text className="text-foreground text-2xl font-bold mb-1">Messages</Text>
          <Text className="text-muted text-sm">Chat with your Care Coordinator.</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <Ionicons name="chatbubbles-outline" size={28} color="#2563eb" />
          </View>
          <Text className="text-foreground font-semibold text-center" style={{ fontSize: 15, marginTop: 12 }}>
            No coordinator yet
          </Text>
          <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            Once a Care Coordinator is assigned to your care plan, you can message
            them here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-3 bg-white"
        style={{ paddingTop: top + 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
      >
        <Avatar name={peer.name} initials={peer.initials} photoUrl={peer.photoUrl} size={40} />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
            {peer.name}
          </Text>
          <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
            {peer.role}
          </Text>
        </View>
      </View>

      <ChatThread
        subscriptionId={thread.subscriptionId}
        messages={thread.messages}
        accent="#1e3a8a"
        bottomInset={0}
      />
    </View>
  );
}
