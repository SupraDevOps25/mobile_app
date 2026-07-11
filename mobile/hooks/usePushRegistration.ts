import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { registerForPushToken } from "@/lib/push";
import { notificationService } from "@/services/notification.service";

/**
 * Registers the device's push token with the backend once the user is signed
 * in, opens the inbox when a push is tapped, and keeps on-screen data fresh
 * when something happens server-side (e.g. a coordinator requests changes on a
 * log) — so screens update without a manual pull-to-refresh.
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || registeredFor.current === user.id) return;
    registeredFor.current = user.id;
    void registerForPushToken().then((token) => {
      if (token) {
        notificationService.registerDevice(token).catch(() => {
          // Non-fatal — the inbox still works without a live token.
        });
      }
    });
  }, [user]);

  useEffect(() => {
    // Tapping a push opens the inbox.
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.push("/notifications" as never);
      },
    );
    // A push arriving in the foreground (EAS/dev builds) means server state
    // changed — refresh active queries so the current screen updates live.
    const receiveSub = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries();
    });
    return () => {
      responseSub.remove();
      receiveSub.remove();
    };
  }, [router, qc]);

  // Fallback that works even without push (e.g. Expo Go): the unread-count
  // badge already polls every 60s. When it rises, a new notification landed —
  // refresh active queries so dashboards reflect the change within a minute.
  const { data: unread } = useUnreadCount();
  const prevCount = useRef<number | null>(null);
  useEffect(() => {
    const count = unread?.count ?? 0;
    if (prevCount.current !== null && count > prevCount.current) {
      void qc.invalidateQueries();
    }
    prevCount.current = count;
  }, [unread?.count, qc]);
}
