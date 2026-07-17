import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
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
  useCoordinatorEarnings,
  useRequestCoordinatorPayout,
} from "@/hooks/useCoordinator";
import { useRefresh } from "@/hooks/useRefresh";
import type { ApiEarningsTransaction } from "@/services/caregiver.service";

const TEAL = "#0d9488";

const MONTHS_UP = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
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
      <Text style={{ color: "#99f6e4", fontSize: 11, marginTop: 2 }}>
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

export default function CoordinatorEarningsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [periodId, setPeriodId] = useState<EarningsPeriodId>("month");

  const { data: earnings, isLoading, refetch } = useCoordinatorEarnings();
  const requestPayout = useRequestCoordinatorPayout();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const period = earnings?.periods.find((p) => p.id === periodId) ?? null;
  const meta = PERIOD_META[periodId];
  const available = earnings?.availableGhs ?? 0;
  const requested = earnings?.requestedGhs ?? 0;
  const activeCases = earnings?.activeCases ?? 0;

  function handleRequestPayout() {
    if (available <= 0) {
      Alert.alert(
        "Nothing to withdraw yet",
        "Payouts unlock once the family has paid for the subscription month. Nothing is available to withdraw right now.",
      );
      return;
    }
    Alert.alert(
      "Request payout",
      `Request a payout of GH₵ ${available.toLocaleString()}? This covers every available month, including any earlier ones you haven't withdrawn.`,
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
      <StatusBar style="light" />

      {/* Teal header — extra bottom padding sits behind the sheet's corners */}
      <View
        className="px-5"
        style={{ paddingTop: top + 12, paddingBottom: 44, backgroundColor: "#134e4a" }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" />
            </Pressable>
            <Text className="text-white font-bold" style={{ fontSize: 18 }}>
              Earnings
            </Text>
          </View>
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
          style={{ color: "#99f6e4", fontSize: 11, letterSpacing: 1, marginTop: 16 }}
        >
          {meta.headline.toUpperCase()}
        </Text>
        <Text className="text-white font-bold" style={{ fontSize: 34, marginTop: 4 }}>
          GH₵ {(period?.totalGhs ?? 0).toLocaleString()}
        </Text>
        <Text style={{ color: "#99f6e4", fontSize: 13, marginTop: 2 }}>
          {period?.subtitle ?? "No earnings yet"}
        </Text>

        {/* Quick stats */}
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <HeaderStat value={String(period?.plans ?? 0)} label="Cases " />
          <HeaderStat value={String(activeCases)} label="All-time cases " />
          <HeaderStat
            value={`GH₵ ${available.toLocaleString()}`}
            label="Available "
          />
        </View>

        {/* Request payout — only appears once earnings are available, i.e. the
            family has paid for a subscription month (admins reconcile payment). */}
        {available > 0 && (
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
                  Request payout · GH₵ {available.toLocaleString()}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* White sheet */}
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
          <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={TEAL}
                colors={[TEAL]}
              />
            }
          >
            <PeriodTabs
              periods={PERIOD_ORDER.map((id) => ({
                id,
                label: PERIOD_META[id].label,
              }))}
              selected={periodId}
              onSelect={setPeriodId}
              accent={TEAL}
            />

            {/* How the fee works */}
            <View
              className="flex-row rounded-2xl p-3.5 mt-5"
              style={{ backgroundColor: "#f0fdfa", borderWidth: 1, borderColor: "#99f6e4" }}
            >
              <Ionicons name="information-circle-outline" size={17} color={TEAL} />
              <Text style={{ color: "#0f766e", fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 }}>
                You earn 8% of each case&apos;s monthly plan, released once the
                family settles that month. Withdraw available months anytime.
              </Text>
            </View>

            {/* Chart */}
            <View className="mt-6">
              <SectionLabel title={period?.chartTitle ?? "Monthly earnings"} />
              <EarningsChart
                bars={period?.bars ?? []}
                accent={TEAL}
                accentMuted="#99f6e4"
              />
            </View>

            {/* Available balance */}
            {available > 0 && (
              <View
                className="flex-row items-center rounded-2xl p-4 mt-6"
                style={{ backgroundColor: "#ccfbf1", borderWidth: 1, borderColor: "#5eead4" }}
              >
                <Ionicons name="wallet-outline" size={18} color="#0f766e" />
                <View className="flex-1 ml-3">
                  <Text style={{ color: "#0f766e", fontSize: 14, fontWeight: "700" }}>
                    Available to withdraw
                  </Text>
                  <Text style={{ color: "#115e59", fontSize: 12, marginTop: 1 }}>
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

            {/* Recent transactions — by case (monthly) */}
            <View className="mt-6">
              <SectionLabel title="Recent transactions" />
              {earnings.recentTransactions.length === 0 ? (
                <View
                  className="rounded-2xl p-5 items-center"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <Ionicons name="receipt-outline" size={22} color="#9ca3af" />
                  <Text className="text-muted text-center" style={{ fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                    No earnings yet. Once the families on your cases pay their
                    monthly subscription, your fees appear here.
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
