import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EarningsChart } from "@/components/earnings/EarningsChart";
import { PeriodTabs } from "@/components/earnings/PeriodTabs";
import { TransactionRow } from "@/components/earnings/TransactionRow";
import {
  EARNINGS_PERIODS,
  PENDING_PAYOUT,
  RECENT_TRANSACTIONS,
  type EarningsPeriodId,
} from "@/constants/earnings";

function HeaderStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 items-center rounded-xl py-3"
      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
    >
      <Text className="text-white font-bold" style={{ fontSize: 16 }}>
        {value}
      </Text>
      <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      className="text-muted font-semibold mb-3"
      style={{ fontSize: 11, letterSpacing: 1 }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

export default function EarningsScreen() {
  const { top } = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [periodId, setPeriodId] = useState<EarningsPeriodId>("month");

  const period = EARNINGS_PERIODS.find((p) => p.id === periodId)!;

  function handleRequestPayout() {
    Alert.alert(
      "Request payout",
      `Request a payout of GH₵ ${PENDING_PAYOUT.amountGhs} to your mobile money account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: () =>
            Alert.alert(
              "Payout requested",
              `GH₵ ${PENDING_PAYOUT.amountGhs} is on its way. It should arrive by ${PENDING_PAYOUT.arrivesBy}.`,
            ),
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Status bar style is global — only claim "light" while this tab is focused */}
      {isFocused && <StatusBar style="light" />}

      {/* Navy header — extra bottom padding sits behind the sheet's rounded corners */}
      <View
        className="px-5"
        style={{ paddingTop: top + 12, paddingBottom: 44, backgroundColor: "#0f2461" }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold" style={{ fontSize: 18 }}>
            Earnings
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert("Coming soon", "Downloading statements is on the way.")
            }
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            hitSlop={8}
          >
            <Ionicons name="download-outline" size={18} color="#ffffff" />
          </Pressable>
        </View>

        <Text
          style={{ color: "#94a3b8", fontSize: 11, letterSpacing: 1, marginTop: 16 }}
        >
          {period.headline.toUpperCase()}
        </Text>
        <Text className="text-white font-bold" style={{ fontSize: 34, marginTop: 4 }}>
          GH₵ {period.totalGhs.toLocaleString()}
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
          {period.subtitle}
        </Text>

        {/* Quick stats */}
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <HeaderStat value={String(period.visits)} label="Visits" />
          <HeaderStat value={`${period.rating} ★`} label="Rating" />
          <HeaderStat value={`${period.careHours}hrs`} label="Care hours" />
        </View>

        {/* Request payout */}
        <Pressable
          onPress={handleRequestPayout}
          className="flex-row items-center justify-center rounded-2xl py-3.5 mt-4"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
        >
          <Ionicons name="card-outline" size={17} color="#ffffff" />
          <Text className="text-white font-semibold" style={{ fontSize: 14, marginLeft: 8 }}>
            Request payout
          </Text>
        </Pressable>
      </View>

      {/* White sheet — static container; content scrolls and clips inside it */}
      <View
        className="flex-1 bg-background"
        style={{
          marginTop: -16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
        <PeriodTabs
          periods={EARNINGS_PERIODS.map((p) => ({ id: p.id, label: p.label }))}
          selected={periodId}
          onSelect={setPeriodId}
        />

        {/* Chart */}
        <View className="mt-6">
          <SectionLabel title={period.chartTitle} />
          <EarningsChart bars={period.bars} />
        </View>

        {/* Pending payout */}
        <View
          className="flex-row items-center rounded-2xl p-4 mt-6"
          style={{ backgroundColor: "#fef9c3", borderWidth: 1, borderColor: "#fde047" }}
        >
          <Ionicons name="time-outline" size={18} color="#a16207" />
          <View className="flex-1 ml-3">
            <Text style={{ color: "#a16207", fontSize: 14, fontWeight: "700" }}>
              Pending payout
            </Text>
            <Text style={{ color: "#854d0e", fontSize: 12, marginTop: 1 }}>
              Processing · arrives by {PENDING_PAYOUT.arrivesBy}
            </Text>
          </View>
          <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
            GH₵ {PENDING_PAYOUT.amountGhs}
          </Text>
        </View>

        {/* Recent transactions */}
        <View className="mt-6">
          <SectionLabel title="Recent transactions" />
          {RECENT_TRANSACTIONS.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </View>
        </ScrollView>
      </View>
    </View>
  );
}
