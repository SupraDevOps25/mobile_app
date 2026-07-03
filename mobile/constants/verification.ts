import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ApiVerificationStatus } from "@/services/caregiver.service";

export interface VerificationMeta {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
}

export function verificationMeta(
  status: ApiVerificationStatus,
): VerificationMeta {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Verified",
        color: "#16a34a",
        bg: "#f0fdf4",
        icon: "checkmark-circle",
        hint: "Your account is verified. You can receive case offers.",
      };
    case "PENDING_REVIEW":
      return {
        label: "Under review",
        color: "#d97706",
        bg: "#fffbeb",
        icon: "time-outline",
        hint: "We're reviewing your documents — usually 1–2 business days.",
      };
    case "REJECTED":
      return {
        label: "Action needed",
        color: "#dc2626",
        bg: "#fef2f2",
        icon: "alert-circle",
        hint: "Something needs fixing. Re-upload your credentials to continue.",
      };
    default:
      return {
        label: "Not submitted",
        color: "#6b7280",
        bg: "#f3f4f6",
        icon: "ellipse-outline",
        hint: "Upload your Ghana Card and PIN card to get verified.",
      };
  }
}
