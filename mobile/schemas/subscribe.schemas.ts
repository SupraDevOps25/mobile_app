import { z } from "zod";

// Care-recipient capture form shown on the subscribe screen. The backend
// requires the recipient's details when a family subscribes to a package.
export const subscribeSchema = z.object({
  name: z.string().min(2, "Enter the recipient's name"),
  age: z.string().regex(/^\d{1,3}$/, "Enter a valid age"),
  gender: z.enum(["MALE", "FEMALE"]),
  relationToAccount: z.string().min(2, "e.g. Father, Mother, Spouse"),
  area: z.string().min(2, "Enter the area (e.g. East Legon)"),
  city: z.string().min(2, "Enter the city (e.g. Accra)"),
  address: z.string().min(4, "Enter the home address"),
  conditions: z.string(),
  basicCareNeeds: z.string().min(4, "Describe the day-to-day care needed"),
});

export type SubscribeFormValues = z.infer<typeof subscribeSchema>;
