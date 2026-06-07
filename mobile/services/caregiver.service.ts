import { api } from "@/lib/api";

export interface CaregiverSummary {
  profileId: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  careTypes: string[];
  yearsExp: number;
  rating: number;
  hourlyRate: number;
  verificationStatus: string;
  availability: "today" | "tomorrow";
}

export interface CaregiverDetail extends CaregiverSummary {
  bio: string;
  availabilitySlots: { id: string; startTime: string; endTime: string }[];
}

export const caregiverService = {
  listAll: () => api.get<CaregiverSummary[]>("/caregivers"),
  getOne: (profileId: string) =>
    api.get<CaregiverDetail>(`/caregivers/${profileId}`),
};
