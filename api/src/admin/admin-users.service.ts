import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Admin user directory + moderation. Powers the notification recipient picker,
// the Users admin page (status + last login), and ban/delete actions.
@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List/search users. With a term, each whitespace word must match name /
   * email / phone (so "john doe" matches first + last). With no term, returns
   * the most recent accounts. Optionally scoped to a role. Max 50.
   */
  async search(q?: string, role?: Role) {
    const term = (q ?? '').trim();
    const terms = term ? term.split(/\s+/).filter(Boolean) : [];

    const users = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(terms.length
          ? {
              AND: terms.map((t) => ({
                OR: [
                  { firstName: { contains: t, mode: 'insensitive' as const } },
                  { lastName: { contains: t, mode: 'insensitive' as const } },
                  { email: { contains: t, mode: 'insensitive' as const } },
                  { phone: { contains: t } },
                ],
              })),
            }
          : {}),
      },
      orderBy: term
        ? [{ firstName: 'asc' }, { lastName: 'asc' }]
        : [{ createdAt: 'desc' }],
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        photoUrl: true,
        status: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      phone: u.phone,
      role: u.role,
      photoUrl: u.photoUrl,
      status: u.status,
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      lastLoginIp: u.lastLoginIp,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  /** Ban or un-ban a user (never an admin, never yourself). */
  async setBanned(
    actorId: string,
    targetId: string,
    banned: boolean,
    reason?: string,
  ) {
    const target = await this.requireModeratable(actorId, targetId);
    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        status: banned ? UserStatus.BANNED : UserStatus.ACTIVE,
        bannedAt: banned ? new Date() : null,
        banReason: banned ? (reason?.trim() ?? null) : null,
      },
      select: { id: true, status: true },
    });
    return updated;
  }

  /** Hard-delete a user. Blocked for accounts still linked to records. */
  async remove(actorId: string, targetId: string) {
    const target = await this.requireModeratable(actorId, targetId);
    try {
      await this.prisma.user.delete({ where: { id: target.id } });
      return { deleted: true, id: target.id };
    } catch (err) {
      // FK constraint — the account is referenced elsewhere (cases, payments…).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === 'P2003' || err.code === 'P2014')
      ) {
        throw new BadRequestException(
          'This account is linked to existing records (cases, payments, etc.) and cannot be deleted. Ban the account instead.',
        );
      }
      throw err;
    }
  }

  /** Common guard: target exists, isn't an admin, and isn't the actor. */
  private async requireModeratable(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot moderate your own account.');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be moderated here.');
    }
    return target;
  }
}
