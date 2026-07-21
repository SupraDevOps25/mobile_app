import { VisitKind, VisitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Cold-start prior: treat a new nurse as if they had a few visits at ~80%
// completion, so reliability starts neutral-high and converges to the real rate
// as visits accrue. Shared by matching (scoring) and the profile display so
// there is a single reliability formula.
const PRIOR = { rate: 0.8, pseudoVisits: 5 };

export type VisitCounts = { completed: number; missed: number };

/** Smoothed completion rate (0–1) from completed vs missed care visits. */
export function reliabilityRate(completed: number, missed: number): number {
  return (
    (completed + PRIOR.pseudoVisits * PRIOR.rate) /
    (completed + missed + PRIOR.pseudoVisits)
  );
}

/** The same rate as a 0–100 percentage, for display. */
export function reliabilityPercent(counts?: VisitCounts): number {
  return Math.round(
    reliabilityRate(counts?.completed ?? 0, counts?.missed ?? 0) * 100,
  );
}

/** Completed vs missed CARE_VISIT counts per caregiver. */
export async function caregiverVisitCounts(
  prisma: PrismaService,
  caregiverIds: string[],
): Promise<Map<string, VisitCounts>> {
  const ids = [...new Set(caregiverIds)];
  if (ids.length === 0) return new Map();
  const grouped = await prisma.visit.groupBy({
    by: ['caregiverId', 'status'],
    where: {
      caregiverId: { in: ids },
      kind: VisitKind.CARE_VISIT,
      status: { in: [VisitStatus.COMPLETED, VisitStatus.MISSED] },
    },
    _count: { _all: true },
  });
  const map = new Map<string, VisitCounts>();
  for (const g of grouped) {
    const c = map.get(g.caregiverId) ?? { completed: 0, missed: 0 };
    if (g.status === VisitStatus.COMPLETED) c.completed = g._count._all;
    else c.missed = g._count._all;
    map.set(g.caregiverId, c);
  }
  return map;
}
