// Physical device (iOS or Android) via Expo Go:
//   Both devices must be on the same Wi-Fi network as your PC.
//   Run `ipconfig` in a new terminal → find "IPv4 Address" under your Wi-Fi adapter.
//   Paste that IP below (e.g. 192.168.1.42).
//
// TEMPORARY: pointed at the deployed Railway API to smoke-test from Expo Go.
// Restore the local line when developing against your local server again.
const DEV_API_URL = "https://supramobileapi-production.up.railway.app";
// const DEV_API_URL = "http://192.168.0.114:3000"; // ← local server

// Production/preview builds hit the deployed Railway API (built from `dev`).
// Swap to https://api.supracarer.com once that domain is pointed at Railway.
// No trailing slash — api.ts appends /api/v1.
export const API_BASE_URL = __DEV__
  ? DEV_API_URL
  : "https://supramobileapi-production.up.railway.app";
