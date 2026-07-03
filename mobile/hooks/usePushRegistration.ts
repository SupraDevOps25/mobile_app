import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { registerForPushToken } from "@/lib/push";
import { notificationService } from "@/services/notification.service";

/**
 * Registers the device's push token with the backend once the user is signed
 * in, and opens the inbox when a push notification is tapped.
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const router = useRouter();
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
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/notifications" as never);
    });
    return () => sub.remove();
  }, [router]);
}
