import { api } from "@/lib/api";

export type ApiNotificationType =
  | "SUBSCRIPTION_CREATED"
  | "TEAM_ASSIGNED"
  | "ASSIGNMENT_OFFER"
  | "ASSIGNMENT_ACCEPTED"
  | "ASSIGNMENT_DECLINED"
  | "CARE_ACTIVATED"
  | "VISIT_REMINDER"
  | "DAILY_LOG_SUBMITTED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "GENERAL";

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

export interface ApiNotificationPreferences {
  push: boolean;
  sms: boolean;
}

export const notificationService = {
  list: () => api.get<ApiNotification[]>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    api.patch<{ updated: number }>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>("/notifications/read-all"),
  registerDevice: (token: string) =>
    api.post<{ registered: boolean }>("/notifications/register-device", {
      token,
    }),
  unregisterDevice: (token: string) =>
    api.post<{ unregistered: boolean }>("/notifications/unregister-device", {
      token,
    }),
  preferences: () =>
    api.get<ApiNotificationPreferences>("/notifications/preferences"),
  updatePreferences: (payload: Partial<ApiNotificationPreferences>) =>
    api.patch<ApiNotificationPreferences>(
      "/notifications/preferences",
      payload,
    ),
};
