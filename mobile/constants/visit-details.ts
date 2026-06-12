export type ConditionTag = {
  label: string;
  bg: string;
  color: string;
};

export type MedicationItem = {
  id: string;
  name: string;
  detail: string; // e.g. "1 tablet · oral · 10:15 AM"
};

export type VisitDetail = {
  id: string;
  patientName: string;
  initials: string;
  avatarColor: string;
  age: number;
  gender: "Male" | "Female";
  area: string; // e.g. "East Legon"
  city: string; // e.g. "Accra"
  conditions: ConditionTag[];
  service: string;
  dateLong: string; // e.g. "Monday, 26 May 2026"
  time: string; // e.g. "10:00 AM"
  durationHrs: number;
  address: string;
  patientNotes: string;
  hourlyRateGhs: number;
  payoutGhs: number;
  medications: MedicationItem[];
};

const VISIT_DETAILS: Record<string, VisitDetail> = {
  "req-1": {
    id: "req-1",
    patientName: "Kofi Asante",
    initials: "KA",
    avatarColor: "#1e3a8a",
    age: 87,
    gender: "Male",
    area: "East Legon",
    city: "Accra",
    conditions: [
      { label: "Hypertension", bg: "#fee2e2", color: "#dc2626" },
      { label: "Diabetes Type 2", bg: "#fef9c3", color: "#a16207" },
      { label: "Mobility issues", bg: "#e0e7ff", color: "#4338ca" },
    ],
    service: "Chronic Disease Care",
    dateLong: "Monday, 26 May 2026",
    time: "10:00 AM",
    durationHrs: 2,
    address: "14 Boundary Rd, East Legon",
    patientNotes:
      "Father needs help with morning medication, BP monitoring and light mobility exercises. He prefers a calm and patient caregiver.",
    hourlyRateGhs: 60,
    payoutGhs: 120,
    medications: [
      { id: "med-1", name: "Amlodipine 5mg", detail: "1 tablet · oral · 10:15 AM" },
      { id: "med-2", name: "Metformin 500mg", detail: "1 tablet · oral · 10:20 AM" },
    ],
  },
  "visit-1": {
    id: "visit-1",
    patientName: "Ama Boateng",
    initials: "AB",
    avatarColor: "#7c3aed",
    age: 64,
    gender: "Female",
    area: "Labone",
    city: "Accra",
    conditions: [
      { label: "Post-surgery", bg: "#fee2e2", color: "#dc2626" },
      { label: "Diabetes Type 2", bg: "#fef9c3", color: "#a16207" },
    ],
    service: "Wound Care",
    dateLong: "Sunday, 24 May 2026",
    time: "9:00 AM",
    durationHrs: 1.5,
    address: "5 Ndabaningi Sithole Rd, Labone",
    patientNotes:
      "Needs dressing change for a post-surgery wound on the left leg. Please check for signs of infection and update the family after the visit.",
    hourlyRateGhs: 60,
    payoutGhs: 90,
    medications: [
      { id: "med-1", name: "Amoxicillin 500mg", detail: "1 capsule · oral · 9:15 AM" },
      { id: "med-2", name: "Paracetamol 1g", detail: "1 tablet · oral · 9:30 AM" },
    ],
  },
  "visit-2": {
    id: "visit-2",
    patientName: "Yaw Darko",
    initials: "YD",
    avatarColor: "#0d9488",
    age: 79,
    gender: "Male",
    area: "Osu",
    city: "Accra",
    conditions: [
      { label: "Arthritis", bg: "#e0e7ff", color: "#4338ca" },
      { label: "Mobility issues", bg: "#fef9c3", color: "#a16207" },
    ],
    service: "Elderly Care",
    dateLong: "Tuesday, 26 May 2026",
    time: "2:00 PM",
    durationHrs: 3,
    address: "21 Oxford St, Osu",
    patientNotes:
      "Grandfather needs companionship, help moving around the house and assistance with his afternoon meal.",
    hourlyRateGhs: 55,
    payoutGhs: 165,
    medications: [
      { id: "med-1", name: "Ibuprofen 400mg", detail: "1 tablet · oral · 2:30 PM" },
    ],
  },
};

export function getVisitDetail(id: string | undefined): VisitDetail | null {
  if (!id) return null;
  return VISIT_DETAILS[id] ?? null;
}
