import { usePushRegistration } from "@/hooks/usePushRegistration";

/** Headless component: registers push + handles notification taps. */
export function PushRegistrar() {
  usePushRegistration();
  return null;
}
