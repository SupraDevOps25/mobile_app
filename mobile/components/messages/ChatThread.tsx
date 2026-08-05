import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSendMessage } from "@/hooks/useMessages";
import type { ApiMessage } from "@/services/message.service";

function Bubble({ m, accent }: { m: ApiMessage; accent: string }) {
  const { width } = useWindowDimensions();
  const maxBubbleWidth = Math.min(width - 64, width * 0.82);
  const longestLineLength = Math.max(
    1,
    ...m.body.split(/\r?\n/).map((line) => line.length),
  );
  const estimatedTextWidth = Math.min(
    maxBubbleWidth - 28,
    Math.max(36, longestLineLength * 8.5),
  );
  const bubbleWidth = estimatedTextWidth + 28;
  const time = new Date(m.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: m.mine ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <View style={{ width: bubbleWidth }}>
        <View
          style={{
            backgroundColor: m.mine ? accent : "#f1f5f9",
            borderRadius: 18,
            borderBottomRightRadius: m.mine ? 5 : 18,
            borderBottomLeftRadius: m.mine ? 18 : 5,
            paddingHorizontal: 14,
            paddingVertical: 9,
            width: bubbleWidth,
          }}
        >
          <Text
            textBreakStrategy="simple"
            style={{
              color: m.mine ? "#ffffff" : "#111827",
              flexShrink: 1,
              flexWrap: "wrap",
              fontSize: 14.5,
              lineHeight: 20,
              minWidth: 0,
              width: bubbleWidth - 28,
            }}
          >
            {m.body}
          </Text>
        </View>
        <Text
          style={{
            color: "#9ca3af",
            fontSize: 10,
            marginTop: 3,
            alignSelf: m.mine ? "flex-end" : "flex-start",
          }}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

// A full-height chat area (message list + composer). The parent renders the
// header and owns the thread query; this handles scrolling, input and sending.
export function ChatThread({
  subscriptionId,
  messages,
  accent = "#0d9488",
  keyboardOffset = 0,
  bottomInset,
}: {
  subscriptionId: string;
  messages: ApiMessage[];
  accent?: string;
  keyboardOffset?: number;
  // Override the resting bottom padding under the composer. Pass 0 when the
  // thread renders inside a tab navigator (the tab bar already covers the
  // device's bottom inset, so adding it again leaves a gap above the tabs).
  bottomInset?: number;
}) {
  const send = useSendMessage(subscriptionId);
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const { bottom: safeBottom } = useSafeAreaInsets();
  const bottom = bottomInset ?? safeBottom;

  // Once the keyboard is up it already covers the home-indicator area, so the
  // composer shouldn't also reserve the bottom safe-area inset — that leftover
  // padding is the gap between the input and the keyboard on iOS.
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, () => setKeyboardUp(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function onSend() {
    const body = text.trim();
    if (!body) return;
    setText("");
    send.mutate(body, {
      onError: (err: Error) => {
        setText(body);
        Alert.alert("Couldn't send", err.message);
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={keyboardOffset}
    >
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center" style={{ paddingVertical: 60 }}>
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: "#f1f5f9" }}
            >
              <Ionicons name="chatbubbles-outline" size={26} color="#94a3b8" />
            </View>
            <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 10, lineHeight: 19 }}>
              No messages yet.{"\n"}Say hello to start the conversation.
            </Text>
          </View>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} accent={accent} />)
        )}
      </ScrollView>

      {/* Composer */}
      <View
        className="flex-row items-end px-3 pt-2 bg-white"
        style={{
          paddingBottom: keyboardUp ? 5 : bottom + 8,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          gap: 8,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor="#9ca3af"
          multiline
          maxFontSizeMultiplier={1.2}
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 42,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#f9fafb",
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 14.5,
            color: "#111827",
          }}
        />
        <Pressable
          onPress={onSend}
          disabled={send.isPending || text.trim().length === 0}
          className="items-center justify-center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: text.trim().length === 0 ? "#cbd5e1" : accent,
          }}
        >
          {send.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#ffffff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
