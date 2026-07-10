import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { useConversations } from "@/hooks/useMessages";
import { useRefresh } from "@/hooks/useRefresh";
import type { ApiConversation } from "@/services/message.service";

function timeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ApiConversation;
  onPress: (item: ApiConversation) => void;
}) {
  const hasUnread = item.unread > 0;
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: hasUnread ? "#99f6e4" : "#eef0f3",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View className="flex-row items-center">
        <Avatar
          name={item.family.name}
          initials={item.family.initials}
          photoUrl={item.family.photoUrl}
          size={46}
        />
        <View className="flex-1 ml-3" style={{ minWidth: 0 }}>
          <View className="flex-row items-center justify-between">
            <Text
              className="text-foreground font-bold"
              style={{ fontSize: 15, flex: 1 }}
              numberOfLines={1}
            >
              {item.family.name}
            </Text>
            {item.lastAt && (
              <Text className="text-muted" style={{ fontSize: 11, marginLeft: 8 }}>
                {timeLabel(item.lastAt)}
              </Text>
            )}
          </View>
          <Text
            className="text-muted"
            style={{
              fontSize: 12.5,
              marginTop: 2,
              fontWeight: hasUnread ? "700" : "400",
              color: hasUnread ? "#0f766e" : "#6b7280",
            }}
            numberOfLines={1}
          >
            {item.lastMessage ?? `Care for ${item.recipientName}`}
          </Text>
        </View>
        {hasUnread && (
          <View
            className="rounded-full items-center justify-center ml-2"
            style={{ minWidth: 20, height: 20, paddingHorizontal: 6, backgroundColor: "#0d9488" }}
          >
            <Text className="text-white" style={{ fontSize: 11, fontWeight: "700" }}>
              {item.unread}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CoordinatorMessagesScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { data: conversations, isLoading, refetch } = useConversations();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const list = conversations ?? [];

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-2 bg-background" style={{ paddingTop: top + 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-1">Messages</Text>
        <Text className="text-muted text-sm">Chat with the families you coordinate.</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
            colors={["#0d9488"]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#0d9488" style={{ marginVertical: 24 }} />
        ) : list.length === 0 ? (
          <View className="items-center" style={{ marginTop: 48 }}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "#ccfbf1" }}
            >
              <Ionicons name="chatbubbles-outline" size={28} color="#0d9488" />
            </View>
            <Text className="text-foreground font-semibold" style={{ fontSize: 15, marginTop: 12 }}>
              No conversations yet
            </Text>
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 4 }}>
              Families you coordinate appear here to chat.
            </Text>
          </View>
        ) : (
          list.map((c) => (
            <ConversationRow
              key={c.subscriptionId}
              item={c}
              onPress={(x) => router.push(`/chat/${x.subscriptionId}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
