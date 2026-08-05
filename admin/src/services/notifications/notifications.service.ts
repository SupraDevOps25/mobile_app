import { http } from "@/services/api";
import type { SendNotificationInput } from "@/schemas/notifications/send.schema";

// Admin manual notification send. The API delivers push + in-app (and falls back
// to WhatsApp) via the same pipeline used for system events.
export const notificationsService = {
  send: (input: SendNotificationInput) =>
    http.post<null>("/notifications/send", input),
};
