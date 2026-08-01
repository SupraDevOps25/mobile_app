import { Badge, type Tone } from "./Badge";

// Central mapping of every status the portal renders → colour + label. Covers
// booking/subscription states and caregiver verification states so one badge
// component stays consistent across the dashboard, bookings, and caregivers.
const MAP: Record<string, { tone: Tone; label: string }> = {
  // Subscriptions / bookings
  ACTIVE: { tone: "green", label: "Active" },
  CONFIRMED: { tone: "blue", label: "Confirmed" },
  TEAM_ASSIGNED: { tone: "blue", label: "Confirmed" },
  AWAITING_ACTIVATION: { tone: "amber", label: "Awaiting" },
  MATCHING: { tone: "amber", label: "Matching" },
  UPCOMING: { tone: "blue", label: "Upcoming" },
  RENEWING: { tone: "amber", label: "Renewing" },
  PENDING: { tone: "amber", label: "Pending" },
  COMPLETED: { tone: "slate", label: "Completed" },
  PAUSED: { tone: "gray", label: "Paused" },
  CANCELLED: { tone: "red", label: "Cancelled" },

  // Caregiver verification
  VERIFIED: { tone: "green", label: "Verified" },
  PENDING_REVIEW: { tone: "amber", label: "Pending review" },
  UNVERIFIED: { tone: "gray", label: "Unverified" },
  REJECTED: { tone: "red", label: "Rejected" },

  // Payouts
  PAID: { tone: "green", label: "Paid" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = MAP[status] ?? { tone: "gray" as Tone, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
