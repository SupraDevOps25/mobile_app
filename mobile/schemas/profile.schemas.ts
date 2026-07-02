import { z } from "zod";

// Ghana phone as typed in the form: 0XXXXXXXXX (10 digits) or XXXXXXXXX (9).
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .regex(/^(?:0\d{9}|\d{9})$/, "Enter a valid Ghana number (e.g. 0244123456)"),
});

export type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

/** Stored +233XXXXXXXXX → local 0XXXXXXXXX for editing. */
export function toLocalPhone(phone: string): string {
  return phone.startsWith("+233") ? `0${phone.slice(4)}` : phone;
}

/** Local 0XXXXXXXXX / XXXXXXXXX → +233XXXXXXXXX for the backend. */
export function toE164Phone(local: string): string {
  const digits = local.startsWith("0") ? local.slice(1) : local;
  return `+233${digits}`;
}
