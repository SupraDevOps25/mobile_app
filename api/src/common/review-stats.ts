import { PrismaService } from '../prisma/prisma.service';

export type ReviewStats = { rating: number; totalReviews: number };

const EMPTY: ReviewStats = { rating: 0, totalReviews: 0 };

/**
 * Live rating aggregates straight from the Review table — the single source of
 * truth for a nurse's star rating and review count. Everything that displays or
 * scores on ratings uses this, so there's no denormalized field to drift out of
 * sync (the caregiver_profiles.rating/totalReviews columns are no longer read).
 */
export async function caregiverReviewStats(
  prisma: PrismaService,
  caregiverIds: string[],
): Promise<Map<string, ReviewStats>> {
  const ids = [...new Set(caregiverIds)];
  if (ids.length === 0) return new Map();
  const grouped = await prisma.review.groupBy({
    by: ['caregiverId'],
    where: { caregiverId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map<string, ReviewStats>();
  for (const g of grouped) {
    map.set(g.caregiverId, {
      rating: g._avg.rating ? Math.round(g._avg.rating * 100) / 100 : 0,
      totalReviews: g._count._all,
    });
  }
  return map;
}

/** Lookup with a zeroed fallback for a nurse who has no reviews yet. */
export function reviewStatsFor(
  stats: Map<string, ReviewStats>,
  caregiverId: string,
): ReviewStats {
  return stats.get(caregiverId) ?? EMPTY;
}
