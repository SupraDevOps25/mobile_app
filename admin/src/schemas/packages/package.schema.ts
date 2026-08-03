import { z } from "zod";

// The form uses a single textarea for inclusions (one per line); we split it
// into a string[] on submit.
export const packageFormSchema = z.object({
  type: z.enum(["WELLNESS", "DAILY_ASSIST", "EXTENDED_ASSIST", "LIVE_IN"]),
  name: z.string().trim().min(1, "Name is required").max(80),
  tagline: z.string().trim().min(1, "Tagline is required").max(160),
  priceGhs: z
    .number({ message: "Enter a valid price" })
    .min(0, "Price can't be negative"),
  inclusions: z.string().trim().min(1, "Add at least one inclusion"),
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

// "one per line" textarea ⇄ string[]
export function inclusionsToText(inclusions: string[]): string {
  return inclusions.join("\n");
}

export function textToInclusions(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
