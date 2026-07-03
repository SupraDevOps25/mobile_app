import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import {
  notificationService,
  type ApiNotificationPreferences,
} from "@/services/notification.service";

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => notificationService.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notificationsUnread,
    queryFn: () => notificationService.unreadCount(),
    // Keep the bell badge reasonably fresh.
    refetchInterval: 60 * 1000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.notificationsUnread });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: qk.notificationPreferences,
    queryFn: () => notificationService.preferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ApiNotificationPreferences>) =>
      notificationService.updatePreferences(payload),
    onSuccess: (prefs) => qc.setQueryData(qk.notificationPreferences, prefs),
  });
}
