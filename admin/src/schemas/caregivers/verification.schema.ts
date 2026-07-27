import { z } from "zod";

// Caregiver verification decision. Mirrors the API's SetVerificationDto: approve
// or reject, with an optional note (recommended when rejecting) the nurse sees.
export const verificationSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().max(500, "Keep the note under 500 characters").optional(),
});

export type VerificationInput = z.infer<typeof verificationSchema>;
