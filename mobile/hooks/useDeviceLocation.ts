import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";

export interface ResolvedLocation {
  lat: number;
  lng: number;
  address: string;
  area: string;
  city: string;
}

function composeAddress(p: Location.LocationGeocodedAddress): string {
  if (p.formattedAddress) return p.formattedAddress;
  const line = [p.streetNumber, p.street].filter(Boolean).join(" ");
  const parts = [
    line,
    p.name && p.name !== p.street ? p.name : "",
    p.district,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Reads the device's current position and reverse-geocodes it into a
 * human address. Handles the permission prompt (and the "denied forever"
 * case by pointing the user to Settings).
 */
export function useDeviceLocation() {
  const [loading, setLoading] = useState(false);

  const getCurrent = useCallback(async (): Promise<ResolvedLocation | null> => {
    setLoading(true);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location permission needed",
          canAskAgain
            ? "Allow location access to use your current position."
            : "Enable location for Supracarer in Settings to use your current position.",
          canAskAgain
            ? [{ text: "OK" }]
            : [
                { text: "Cancel", style: "cancel" },
                { text: "Open settings", onPress: () => Linking.openSettings() },
              ],
        );
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      let place: Location.LocationGeocodedAddress | undefined;
      try {
        [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      } catch {
        // Reverse geocoding can fail (e.g. offline) — still return the coords.
      }

      return {
        lat: latitude,
        lng: longitude,
        address: place ? composeAddress(place) : "",
        area: place?.district ?? place?.subregion ?? "",
        city: place?.city ?? place?.region ?? "",
      };
    } catch (err) {
      Alert.alert(
        "Couldn't get location",
        err instanceof Error ? err.message : "Please try again.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrent, loading };
}
