import * as StoreReview from "expo-store-review";
import { Alert } from "react-native";

/**
 * Ask the user to rate the app. The native in-app review prompt only works in
 * a store-installed production build (it's a silent no-op in dev/Expo Go), so
 * in development — or when it isn't available — we show a friendly message
 * instead of doing nothing.
 */
export async function rateApp() {
  if (!__DEV__) {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
    } catch {
      // Fall through to the message below.
    }
  }
  Alert.alert(
    "Rate Supracarer",
    "You'll be able to rate us on the store once the app is published. Thank you for your support!",
  );
}
