// Clinical competencies used for nurse matching (Step 3 of the care journey).
// Nurses carry a list of these; assignments declare which ones a case requires.

export type CompetencyId =
  | "personal-care"
  | "hygiene"
  | "feeding"
  | "mobility"
  | "medication"
  | "vitals"
  | "wound-care"
  | "catheter-care"
  | "chronic-disease"
  | "hypertension"
  | "diabetes"
  | "stroke-rehab"
  | "dementia"
  | "geriatric"
  | "rehab"
  | "palliative";

export type Competency = {
  id: CompetencyId;
  label: string;
};

export const COMPETENCIES: Competency[] = [
  { id: "personal-care", label: "Personal care assistance" },
  { id: "hygiene", label: "Hygiene & bathing support" },
  { id: "feeding", label: "Feeding assistance" },
  { id: "mobility", label: "Mobility support" },
  { id: "medication", label: "Medication management" },
  { id: "vitals", label: "Vitals monitoring" },
  { id: "wound-care", label: "Wound care" },
  { id: "catheter-care", label: "Catheter care" },
  { id: "chronic-disease", label: "Chronic disease monitoring" },
  { id: "hypertension", label: "Hypertension management" },
  { id: "diabetes", label: "Diabetes management" },
  { id: "stroke-rehab", label: "Stroke rehabilitation support" },
  { id: "dementia", label: "Dementia care" },
  { id: "geriatric", label: "Geriatric / elderly care" },
  { id: "rehab", label: "Rehabilitation support" },
  { id: "palliative", label: "Palliative care" },
];

const LABEL_BY_ID: Record<CompetencyId, string> = COMPETENCIES.reduce(
  (acc, c) => {
    acc[c.id] = c.label;
    return acc;
  },
  {} as Record<CompetencyId, string>,
);

export function getCompetencyLabel(id: CompetencyId): string {
  return LABEL_BY_ID[id] ?? id;
}
