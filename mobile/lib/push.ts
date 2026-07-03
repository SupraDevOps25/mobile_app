import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// How a notification is shown while the app is open/foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | undefined {
  const fromExtra = (
    Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  )?.eas?.projectId;
  const fromEas = (Constants as { easConfig?: { projectId?: string } }).easConfig
    ?.projectId;
  return fromExtra ?? fromEas;
}

/**
 * Requests notification permission and returns this device's Expo push token,
 * or null if unavailable (simulator, permission denied, or no EAS project yet).
 */
export async function registerForPushToken(): Promise<string | null> {
  // Push tokens only exist on real hardware.
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const projectId = getProjectId();
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    // No EAS projectId (e.g. before `eas init` / outside a dev build) —
    // a token can't be minted. Fail quietly; delivery falls back to inbox.
    return null;
  }
}
