import AsyncStorage from "@react-native-async-storage/async-storage";

// Onboarding "seen" flags are scoped per user id. AsyncStorage is device-global,
// so a single "cg_onboarding_seen" key would let a NEW account (common when
// testing multiple accounts on one device, or a shared phone) skip onboarding
// just because a previous account on the device had completed it. Keying by the
// signed-in user's id keeps each account independent.

type Audience = "cg" | "fam";

function key(audience: Audience, userId: string): string {
  return `${audience}_onboarding_seen:${userId}`;
}

export async function isOnboardingSeen(
  audience: Audience,
  userId: string,
): Promise<boolean> {
  return (await AsyncStorage.getItem(key(audience, userId))) === "true";
}

export async function markOnboardingSeen(
  audience: Audience,
  userId: string,
): Promise<void> {
  await AsyncStorage.setItem(key(audience, userId), "true");
}
