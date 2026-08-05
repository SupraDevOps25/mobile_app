import { z } from "zod";

// Notification types the API accepts. GENERAL is the natural choice for a manual
// admin message; the rest are normally system-generated but allowed here too.
export const NOTIFICATION_TYPES = [
  "GENERAL",
  "SUBSCRIPTION_CREATED",
  "TEAM_ASSIGNED",
  "ASSIGNMENT_OFFER",
  "ASSIGNMENT_ACCEPTED",
  "ASSIGNMENT_DECLINED",
  "CARE_ACTIVATED",
  "VISIT_REMINDER",
  "DAILY_LOG_SUBMITTED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
] as const;

export const sendNotificationSchema = z.object({
  userId: z.string().trim().min(1, "Recipient user ID is required"),
  type: z.enum(NOTIFICATION_TYPES),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Keep the title under 120 characters"),
  body: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(500, "Keep the message under 500 characters"),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
