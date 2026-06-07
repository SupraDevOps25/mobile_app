import { Text, View } from "react-native";

type Props = {
  hourlyRate: number;
  durationHours: number;
};

const PLATFORM_FEE = 10;

function PriceRow({
  label,
  amount,
  bold,
  navy,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  navy?: boolean;
}) {
  const color = navy ? "#1e3a8a" : "#111827";
  const weight = bold ? "700" : "400";

  return (
    <View className="flex-row items-center justify-between py-2.5">
      <Text style={{ fontSize: 14, fontWeight: weight, color }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: weight, color }}>
        GHC {amount.toFixed(2)}
      </Text>
    </View>
  );
}

export function PriceBreakdownSection({ hourlyRate, durationHours }: Props) {
  const serviceTotal = hourlyRate * durationHours;
  const total = serviceTotal + PLATFORM_FEE;

  return (
    <View
      className="mx-5 rounded-2xl px-5 py-2"
      style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6" }}
    >
      <Text
        className="text-foreground font-semibold pt-2 pb-1"
        style={{ fontSize: 13, letterSpacing: 0.5 }}
      >
        PRICE BREAKDOWN
      </Text>

      <PriceRow
        label={`GHC ${hourlyRate}/hr × ${durationHours} ${durationHours === 1 ? "hour" : "hours"}`}
        amount={serviceTotal}
      />
      <PriceRow label="Platform fee" amount={PLATFORM_FEE} />

      <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 4 }} />

      <PriceRow label="Total" amount={total} bold navy />
    </View>
  );
}
