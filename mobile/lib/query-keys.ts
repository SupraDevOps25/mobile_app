// Centralized React Query cache keys so screens that read and screens that
// mutate the same data stay in sync (invalidate by the same key).
export const qk = {
  packages: ["packages"] as const,
  package: (type: string) => ["packages", type] as const,

  activeSubscription: ["subscription", "active"] as const,
  subscriptionHistory: ["subscription", "history"] as const,
  pastCare: (id: string) => ["subscription", "history", id] as const,

  offers: ["assignments", "offers"] as const,
  myAssignments: ["assignments", "mine"] as const,
  assignment: (id: string) => ["assignments", id] as const,

  upcomingVisits: ["visits", "upcoming"] as const,
  carePlan: ["visits", "care-plan"] as const,
  visit: (id: string) => ["visits", id] as const,

  caregiverProfile: ["caregivers", "me"] as const,

  invoices: ["billing", "invoices"] as const,

  familyStats: ["family", "stats"] as const,
  familyProfile: ["family", "me"] as const,
  familyAddresses: ["family", "addresses"] as const,
  paymentMethods: ["family", "payment-methods"] as const,

  coordinatorCases: ["coordinator", "cases"] as const,
  coordinatorLogs: ["coordinator", "logs"] as const,
};
