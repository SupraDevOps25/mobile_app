import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .trim()
    .regex(/^\+233\d{9}$/, "Phone must be a Ghana number (+233XXXXXXXXX)"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
