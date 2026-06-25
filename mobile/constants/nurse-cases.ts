import type { AssignmentRole } from "@/constants/assignments";
import type { PackageId } from "@/constants/packages";

// A nurse's view of an accepted assignment: an active CASE for a client, which
// generates VISITS over the month per the package schedule. The delivery
// screens (active-visit, care-report) read a visit and its parent case here.

export type Medication = {
  id: string;
  name: string;
  detail: string; // e.g. "1 tablet · oral · 10:15 AM"
};

export type NurseVisitKind = "initial-assessment" | "care-visit";
export type NurseVisitStatus = "scheduled" | "in-progress" | "completed" | "missed";

export type NurseVisit = {
  id: string;
  caseId: string;
  kind: NurseVisitKind;
  status: NurseVisitStatus;
  date: string; // ISO 8601
  time: string; // e.g. "10:00 AM"
  durationHrs: number;
  tag: string; // display hint, e.g. "Today", "Fri"
};

export type CaseClient = {
  name: string;
  initials: string;
  avatarColor: string;
  age: number;
  gender: "Male" | "Female";
  area: string;
  city: string;
  address: string;
  conditions: string[];
  careNeeds: string;
  medications: Medication[];
};

export type NurseCase = {
  id: string;
  role: AssignmentRole;
  package: PackageId;
  careType: string; // clinical focus label, e.g. "Chronic Disease Care"
  coordinatorName: string;
  client: CaseClient;
  visits: NurseVisit[];
};

export const NURSE_CASES: NurseCase[] = [
  {
    id: "case-1",
    role: "primary",
    package: "daily-assist",
    careType: "Chronic Disease Care",
    coordinatorName: "Efua Owusu",
    client: {
      name: "Kofi Asante",
      initials: "KA",
      avatarColor: "#1e3a8a",
      age: 87,
      gender: "Male",
      area: "East Legon",
      city: "Accra",
      address: "14 Boundary Rd, East Legon",
      conditions: ["Hypertension", "Diabetes Type 2", "Mobility issues"],
      careNeeds:
        "Help with morning medication, BP monitoring and light mobility exercises.",
      medications: [
        { id: "med-1", name: "Amlodipine 5mg", detail: "1 tablet · oral · 10:15 AM" },
        { id: "med-2", name: "Metformin 500mg", detail: "1 tablet · oral · 10:20 AM" },
      ],
    },
    visits: [
      {
        id: "nv-1",
        caseId: "case-1",
        kind: "initial-assessment",
        status: "completed",
        date: "2026-06-02T09:00:00.000Z",
        time: "9:00 AM",
        durationHrs: 2,
        tag: "Done",
      },
      {
        id: "nv-2",
        caseId: "case-1",
        kind: "care-visit",
        status: "scheduled",
        date: "2026-06-24T10:00:00.000Z",
        time: "10:00 AM",
        durationHrs: 8,
        tag: "Today",
      },
    ],
  },
  {
    id: "case-2",
    role: "primary",
    package: "extended-assist",
    careType: "Elderly Care",
    coordinatorName: "Efua Owusu",
    client: {
      name: "Yaw Darko",
      initials: "YD",
      avatarColor: "#0d9488",
      age: 79,
      gender: "Male",
      area: "Osu",
      city: "Accra",
      address: "21 Oxford St, Osu",
      conditions: ["Arthritis", "Mobility issues"],
      careNeeds:
        "Companionship, help moving around the house and assistance with the afternoon meal.",
      medications: [
        { id: "med-1", name: "Ibuprofen 400mg", detail: "1 tablet · oral · 2:30 PM" },
      ],
    },
    visits: [
      {
        id: "nv-3",
        caseId: "case-2",
        kind: "care-visit",
        status: "scheduled",
        date: "2026-06-26T14:00:00.000Z",
        time: "2:00 PM",
        durationHrs: 12,
        tag: "Fri",
      },
    ],
  },
];

export type NurseVisitWithCase = { visit: NurseVisit; nurseCase: NurseCase };

/** Resolve a visit id to the visit and the case it belongs to. */
export function getNurseVisit(visitId: string | undefined): NurseVisitWithCase | null {
  if (!visitId) return null;
  for (const nurseCase of NURSE_CASES) {
    const visit = nurseCase.visits.find((v) => v.id === visitId);
    if (visit) return { visit, nurseCase };
  }
  return null;
}

/** Scheduled/in-progress visits across all of the nurse's cases, soonest first. */
export function getUpcomingVisits(): NurseVisitWithCase[] {
  return NURSE_CASES.flatMap((nurseCase) =>
    nurseCase.visits.map((visit) => ({ visit, nurseCase })),
  )
    .filter(
      ({ visit }) => visit.status === "scheduled" || visit.status === "in-progress",
    )
    .sort(
      (a, b) => new Date(a.visit.date).getTime() - new Date(b.visit.date).getTime(),
    );
}
