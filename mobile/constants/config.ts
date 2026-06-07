// Physical device (iOS or Android) via Expo Go:
//   Both devices must be on the same Wi-Fi network as your PC.
//   Run `ipconfig` in a new terminal → find "IPv4 Address" under your Wi-Fi adapter.
//   Paste that IP below (e.g. 192.168.1.42).
const DEV_API_URL = "http://192.168.0.114:3000"; // ← replace YOUR_LOCAL_IP

export const API_BASE_URL = __DEV__
  ? DEV_API_URL
  : "https://api.supracarer.com";
