import { Injectable } from '@nestjs/common';
import { VisitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Admin visit lookup — lets an admin find a visit (by recipient/nurse name or
// status) so they can manually override its status via PATCH /visits/:id/status.
@Injectable()
export class AdminVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: VisitStatus, q?: string) {
    const term = (q ?? '').trim();
    const terms = term ? term.split(/\s+/).filter(Boolean) : [];

    const visits = await this.prisma.visit.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(terms.length
          ? {
              AND: terms.map((t) => ({
                OR: [
                  {
                    subscription: {
                      careRecipient: {
                        name: { contains: t, mode: 'insensitive' as const },
                      },
                    },
                  },
                  {
                    caregiver: {
                      user: {
                        firstName: {
                          contains: t,
                          mode: 'insensitive' as const,
                        },
                      },
                    },
                  },
                  {
                    caregiver: {
                      user: {
                        lastName: { contains: t, mode: 'insensitive' as const },
                      },
                    },
                  },
                ],
              })),
            }
          : {}),
      },
      orderBy: { scheduledFor: 'desc' },
      take: 50,
      include: {
        subscription: {
          select: { careRecipient: { select: { name: true } } },
        },
        caregiver: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        log: { select: { id: true } },
      },
    });

    return visits.map((v) => ({
      id: v.id,
      status: v.status,
      kind: v.kind,
      scheduledFor: v.scheduledFor.toISOString(),
      durationHrs: v.durationHrs,
      nurseName:
        `${v.caregiver.user.firstName} ${v.caregiver.user.lastName}`.trim(),
      recipientName: v.subscription.careRecipient.name,
      hasLog: Boolean(v.log),
    }));
  }
}
