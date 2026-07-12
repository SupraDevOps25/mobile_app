import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { ChatThread } from "@/components/messages/ChatThread";
import { useMessageThread } from "@/hooks/useMessages";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { data: thread, isLoading } = useMessageThread(id);
  const peer = thread?.peer ?? null;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-3 bg-white"
        style={{ paddingTop: top + 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        {peer && (
          <Avatar
            name={peer.name}
            initials={peer.initials}
            photoUrl={peer.photoUrl}
            size={38}
          />
        )}
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-bold" style={{ fontSize: 16 }}>
            {peer?.name ?? "Conversation"}
          </Text>
          {peer && (
            <Text className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>
              {peer.role}
            </Text>
          )}
        </View>
      </View>

      {isLoading || !thread ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <ChatThread
          subscriptionId={thread.subscriptionId}
          messages={thread.messages}
          accent="#0d9488"
        />
      )}
    </View>
  );
}
