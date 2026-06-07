/**
 * PaymentProcessScreen
 *
 * Full flow:
 *  1. Parse date + time + duration from params → build ISO startTime / endTime.
 *  2. POST /shifts/instant-book  → creates a CONFIRMED shift, returns shiftId.
 *  3. POST /payments/initialize  → calls Paystack, returns authorizationUrl + reference.
 *  4. Opens Paystack checkout in the system browser via expo-web-browser.
 *     Paystack redirects to mobile://payment-callback when done.
 *  5. POST /payments/verify      → confirms status server-side (never trust callback alone).
 *  6. Navigates to /payment/success or /payment/failed.
 *
 * Security:
 *  - Paystack secret key never leaves the backend.
 *  - Payment status is always verified server-side before navigating to success.
 *  - HMAC-SHA512 webhook handles async payment events independently.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCaregiver } from "@/hooks/useCaregiver";
import { bookingService, type CareType } from "@/services/booking.service";
import { paymentService } from "@/services/payment.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimeToHoursMinutes(time: string): { hours: number; minutes: number } {
  const [timePart, period] = time.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  let hours = h;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes: m };
}

function parseDurationHours(duration: string): number {
  const match = duration.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function buildStartEnd(
  dateIso: string,
  time: string,
  durationHours: number,
): { startTime: string; endTime: string } {
  const { hours, minutes } = parseTimeToHoursMinutes(time);
  const start = new Date(dateIso);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

function parseReference(callbackUrl: string): string | null {
  const match = callbackUrl.match(/[?&]reference=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Maps caregiver role/service display names → Prisma CareType enum values
const ROLE_TO_CARE_TYPE: Record<string, CareType> = {
  "Elder Care Specialist": "ELDERLY_CARE",
  "Registered Nurse": "ELDERLY_CARE",
  "Physiotherapist": "DISABILITY_CARE",
  "Child Care Specialist": "CHILD_CARE",
  "Disability Care Specialist": "DISABILITY_CARE",
  "Postpartum Care Specialist": "POSTPARTUM_CARE",
  "Palliative Care Specialist": "PALLIATIVE_CARE",
};

// ─── Stage type ────────────────────────────────────────────────────────────────

type Stage = "idle" | "booking" | "initializing" | "verifying" | "error";

const STAGE_LABELS: Partial<Record<Stage, string>> = {
  booking: "Creating your booking…",
  initializing: "Connecting to Paystack…",
  verifying: "Verifying payment…",
};

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentProcessScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { caregiverId, date, time, duration, address, notes, totalAmount } =
    useLocalSearchParams<{
      caregiverId: string;
      date: string;
      time: string;
      duration: string;
      address: string;
      notes?: string;
      totalAmount: string;
    }>();

  const [stage, setStage] = useState<Stage>("idle");

  const { data: caregiver } = useCaregiver(caregiverId);
  const displayName = caregiver?.name ?? "Your caregiver";
  const displayRole = caregiver?.role ?? "";
  const avatarColor = caregiver?.avatarColor ?? "#1e3a8a";
  const initials = caregiver?.initials ?? caregiverId?.slice(0, 2).toUpperCase() ?? "CA";

  const isLoading =
    stage === "booking" || stage === "initializing" || stage === "verifying";

  function navigateToFailed(error: string) {
    router.replace({
      pathname: "/payment/failed" as any,
      params: { error, caregiverId, date, time, duration, address, totalAmount },
    });
  }

  async function handlePay() {
    if (!caregiverId || !date || !time || !duration) {
      navigateToFailed("Missing booking details. Please go back and try again.");
      return;
    }

    try {
      // ── Step 1: create a CONFIRMED shift ────────────────────────────────────
      setStage("booking");
      const durationHours = parseDurationHours(duration);
      const { startTime, endTime } = buildStartEnd(date, time, durationHours);
      const careType: CareType =
        ROLE_TO_CARE_TYPE[displayRole] ?? "ELDERLY_CARE";

      const shift = await bookingService.instantBook({
        caregiverProfileId: caregiverId,
        startTime,
        endTime,
        careType,
        notes: notes ?? undefined,
      });

      // ── Step 2: initialize Paystack transaction ──────────────────────────────
      setStage("initializing");
      const { authorizationUrl, reference } =
        await paymentService.initialize(shift.id);

      // ── Step 3: open Paystack checkout — closes on deep-link redirect ────────
      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        "mobile://payment-callback",
      );

      if (result.type === "cancel" || result.type === "dismiss") {
        setStage("idle");
        return;
      }

      if (result.type !== "success" || !result.url) {
        navigateToFailed("Payment was not completed. Please try again.");
        return;
      }

      // ── Step 4: verify server-side — never trust the callback URL alone ──────
      setStage("verifying");
      const parsedRef = parseReference(result.url) ?? reference;
      const payment = await paymentService.verify(parsedRef);

      if (payment.status === "SUCCESS") {
        router.replace({
          pathname: "/payment/success" as any,
          params: {
            caregiverId,
            date,
            time,
            duration,
            address,
            bookingRef: `#SC-${payment.id.slice(0, 5).toUpperCase()}`,
          },
        });
      } else {
        navigateToFailed("Payment was not successful. Please try again.");
      }
    } catch (err) {
      navigateToFailed(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setStage("idle");
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4"
        style={{ paddingTop: top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          disabled={isLoading}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
          Complete payment
        </Text>
      </View>

      <View className="flex-1 px-5 justify-between pb-10">
        <View>
          {/* Caregiver + amount card */}
          <View
            className="flex-row items-center p-4 rounded-2xl mb-6"
            style={{
              backgroundColor: "#f9fafb",
              borderWidth: 1,
              borderColor: "#f3f4f6",
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: avatarColor }}
            >
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                {initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-bold" style={{ fontSize: 15 }}>
                {displayName}
              </Text>
              {displayRole ? (
                <Text className="text-muted" style={{ fontSize: 12 }}>
                  {displayRole}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="text-foreground font-bold" style={{ fontSize: 18 }}>
                GHC {totalAmount}
              </Text>
              <Text className="text-muted" style={{ fontSize: 11 }}>
                Total due
              </Text>
            </View>
          </View>

          {/* Security badge */}
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="lock-closed" size={14} color="#6b7280" />
            <Text className="text-muted" style={{ fontSize: 12 }}>
              Secured by Paystack · 256-bit SSL encryption
            </Text>
          </View>
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <View className="items-center gap-3 mb-4">
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text className="text-muted" style={{ fontSize: 14 }}>
              {STAGE_LABELS[stage]}
            </Text>
          </View>
        )}

        {/* Pay button */}
        <Pressable
          onPress={handlePay}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? "#d1d5db" : "#1e3a8a",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="lock-closed" size={16} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Pay GHC {totalAmount} with Paystack
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
