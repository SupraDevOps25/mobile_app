import { z } from "zod";

// Ghana phone: 0XXXXXXXXX (10 digits, leading 0) or XXXXXXXXX (9 digits without 0).
// Zod strips the leading 0 and prepends +233 so the backend always receives +233XXXXXXXXX.
const ghanaPhone = z
  .string()
  .regex(
    /^(?:0\d{9}|\d{9})$/,
    "Enter a valid Ghana number (e.g. 0244123456)",
  )
  .transform((val) => `+233${val.startsWith("0") ? val.slice(1) : val}`);

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: ghanaPhone,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// Sign-in accepts a valid email OR a valid Ghana phone number (same 9–10 digit format).
export const signInSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Email or phone number is required")
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isGhanaPhone = /^(?:0\d{9}|\d{9})$/.test(val);
        return isEmail || isGhanaPhone;
      },
      "Enter a valid email or Ghana phone number (e.g. 0244123456)",
    ),
  password: z.string().min(1, "Password is required"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
