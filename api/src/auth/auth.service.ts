import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user + role-specific profile in one transaction so
    // we never end up with a user that has no profile.
    const user = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await tx.user.create({
          data: {
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
          },
        });

        if (dto.role === Role.CAREGIVER) {
          await tx.caregiverProfile.create({
            data: { userId: created.id, careTypes: [] },
          });
        } else {
          await tx.familyProfile.create({
            data: { userId: created.id },
          });
        }

        return created;
      },
    );

    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        caregiverProfile: true,
        familyProfile: true,
      },
    });

    return user;
  }

  private signToken(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
