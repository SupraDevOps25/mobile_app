import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Admin user lookup — powers the recipient picker for manual notifications (and
// any future admin action that needs to target a specific account).
@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search users by name / email / phone, optionally scoped to a role. Each
   * whitespace term must match one of those fields, so "john doe" matches a
   * first + last name. Returns at most 20 results.
   */
  async search(q?: string, role?: Role) {
    const term = (q ?? '').trim();
    if (term.length < 1) return [];

    const terms = term.split(/\s+/).filter(Boolean);

    const users = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        AND: terms.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: 'insensitive' as const } },
            { lastName: { contains: t, mode: 'insensitive' as const } },
            { email: { contains: t, mode: 'insensitive' as const } },
            { phone: { contains: t } },
          ],
        })),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        photoUrl: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phone,
      role: u.role,
      photoUrl: u.photoUrl,
    }));
  }
}
