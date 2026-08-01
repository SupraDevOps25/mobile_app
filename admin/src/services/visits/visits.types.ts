export type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "MISSED";

export type VisitKind = "CARE_VISIT" | "ASSESSMENT";

export interface AdminVisit {
  id: string;
  status: VisitStatus;
  kind: VisitKind;
  scheduledFor: string;
  durationHrs: number;
  nurseName: string;
  recipientName: string;
  hasLog: boolean;
}

export interface SetVisitStatusResult {
  id: string;
  status: VisitStatus;
}

// The statuses an admin can override a visit to.
export const VISIT_STATUSES: VisitStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "MISSED",
];
