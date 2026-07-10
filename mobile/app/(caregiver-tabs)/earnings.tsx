import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EarningsChart } from "@/components/earnings/EarningsChart";
import { PeriodTabs } from "@/components/earnings/PeriodTabs";
import { TransactionRow } from "@/components/earnings/TransactionRow";
import {
  PERIOD_META,
  PERIOD_ORDER,
  type EarningsPeriodId,
  type Transaction,
} from "@/constants/earnings";
import {
  useCaregiverEarnings,
  useRequestPayout,
} from "@/hooks/useCaregiverProfile";
import type { ApiEarningsTransaction } from "@/services/caregiver.service";

const MONTHS_UP = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function toRow(t: ApiEarningsTransaction): Transaction {
  const d = new Date(t.date);
  return {
    id: t.id,
    dayOfMonth: d.getDate(),
    month: MONTHS_UP[d.getMonth()],
    year: d.getFullYear(),
    patientName: t.patientName,
    service: t.service,
    amountGhs: t.amountGhs,
    status: t.status,
  };
}

function HeaderStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 items-center rounded-xl py-3"
      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
    >
      <Text className="text-white font-bold" style={{ fontSize: 16 }} numberOfLines={1} adjustsFontSizeToFit>
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

  const { data: earnings, isLoading } = useCaregiverEarnings();
  const requestPayout = useRequestPayout();

  const period = earnings?.periods.find((p) => p.id === periodId) ?? null;
  const meta = PERIOD_META[periodId];
  const ratingLabel =
    earnings && earnings.rating > 0 ? earnings.rating.toFixed(1) : "—";
  const available = earnings?.availableGhs ?? 0;
  const requested = earnings?.requestedGhs ?? 0;

  function handleRequestPayout() {
    if (available <= 0) {
      Alert.alert(
        "Nothing to withdraw yet",
        "Payouts unlock at the end of each subscription month, once the family has paid. Nothing is available to withdraw right now.",
      );
      return;
    }
    Alert.alert(
      "Request payout",
      `Request a payout of GH₵ ${available.toLocaleString()} for your completed months?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: () =>
            requestPayout.mutate(undefined, {
              onSuccess: (res) =>
                Alert.alert(
                  "Payout requested",
                  `GH₵ ${res.totalGhs.toLocaleString()} across ${res.count} ${
                    res.count === 1 ? "month" : "months"
                  } has been requested. An admin will disburse it and mark it paid.`,
                ),
              onError: (err: Error) =>
                Alert.alert("Couldn't request payout", err.message),
            }),
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
          {meta.headline.toUpperCase()}
        </Text>
        <Text className="text-white font-bold" style={{ fontSize: 34, marginTop: 4 }}>
          GH₵ {(period?.totalGhs ?? 0).toLocaleString()}
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
          {period?.subtitle ?? "No earnings yet"}
        </Text>

        {/* Quick stats */}
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <HeaderStat value={String(period?.plans ?? 0)} label="Care plans " />
          <HeaderStat value={`${ratingLabel} ★`} label="Rating " />
          <HeaderStat
            value={`GH₵ ${available.toLocaleString()}`}
            label="Available "
          />
        </View>

        {/* Request payout */}
        <Pressable
          onPress={handleRequestPayout}
          disabled={requestPayout.isPending}
          className="flex-row items-center justify-center rounded-2xl py-3.5 mt-4"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
        >
          {requestPayout.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="card-outline" size={17} color="#ffffff" />
              <Text className="text-white font-semibold" style={{ fontSize: 14, marginLeft: 8 }}>
                {available > 0
                  ? `Request payout · GH₵ ${available.toLocaleString()}`
                  : "Request payout"}
              </Text>
            </>
          )}
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
        {isLoading || !earnings ? (
          <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <PeriodTabs
              periods={PERIOD_ORDER.map((id) => ({
                id,
                label: PERIOD_META[id].label,
              }))}
              selected={periodId}
              onSelect={setPeriodId}
            />

            {/* Chart */}
            <View className="mt-6">
              <SectionLabel title={period?.chartTitle ?? "Monthly earnings"} />
              <EarningsChart bars={period?.bars ?? []} />
            </View>

            {/* Available balance — completed months ready to withdraw */}
            {available > 0 && (
              <View
                className="flex-row items-center rounded-2xl p-4 mt-6"
                style={{ backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac" }}
              >
                <Ionicons name="wallet-outline" size={18} color="#15803d" />
                <View className="flex-1 ml-3">
                  <Text style={{ color: "#15803d", fontSize: 14, fontWeight: "700" }}>
                    Available to withdraw
                  </Text>
                  <Text style={{ color: "#166534", fontSize: 12, marginTop: 1 }}>
                    Completed months the family has paid
                  </Text>
                </View>
                <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                  GH₵ {available.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Requested — awaiting the admin to disburse and mark paid */}
            {requested > 0 && (
              <View
                className="flex-row items-center rounded-2xl p-4 mt-3"
                style={{ backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe" }}
              >
                <Ionicons name="hourglass-outline" size={18} color="#4338ca" />
                <View className="flex-1 ml-3">
                  <Text style={{ color: "#4338ca", fontSize: 14, fontWeight: "700" }}>
                    Payout requested
                  </Text>
                  <Text style={{ color: "#4f46e5", fontSize: 12, marginTop: 1 }}>
                    Awaiting disbursement by an admin
                  </Text>
                </View>
                <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                  GH₵ {requested.toLocaleString()}
                </Text>
              </View>
            )}

            {/* Recent transactions — by subscription (monthly) */}
            <View className="mt-6">
              <SectionLabel title="Recent transactions" />
              {earnings.recentTransactions.length === 0 ? (
                <View
                  className="rounded-2xl p-5 items-center"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <Ionicons name="receipt-outline" size={22} color="#9ca3af" />
                  <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                    No earnings yet. Once families you care for pay their monthly
                    subscription, your earnings appear here.
                  </Text>
                </View>
              ) : (
                earnings.recentTransactions.map((t) => (
                  <TransactionRow key={t.id} transaction={toRow(t)} />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
