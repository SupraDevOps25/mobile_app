export const ROLES = [
  {
    id: "FAMILY",
    label: "Patient or Family",
    desc: "I'm looking for care for myself or a loved one",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "CAREGIVER",
    label: "Caregiver",
    desc: "I'm a healthcare professional looking to provide care",
    emoji: "👩‍⚕️",
  },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];
