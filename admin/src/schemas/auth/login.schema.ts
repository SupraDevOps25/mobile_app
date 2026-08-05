import { z } from "zod";

// Login form validation. The API accepts an email OR a phone in one field, so
// we only require non-empty here and let the backend resolve the account.
export const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
