import { z } from "zod";

// Step 1 of reset: ask which account. The API accepts an email or phone and
// emails a 6-digit code; we only require non-empty here.
export const forgotSchema = z.object({
  emailOrPhone: z.string().trim().min(1, "Email or phone is required"),
});

export type ForgotInput = z.infer<typeof forgotSchema>;

// Step 2 of reset: the emailed 6-digit code + a new password (confirmed).
export const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetInput = z.infer<typeof resetSchema>;
