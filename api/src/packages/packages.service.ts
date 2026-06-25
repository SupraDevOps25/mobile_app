import { Injectable, NotFoundException } from '@nestjs/common';
import { Package, PackageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const packages = await this.prisma.package.findMany({
      orderBy: { priceGhs: 'asc' },
    });
    return packages.map((p) => this.toResponse(p));
  }

  async findOne(type: PackageType) {
    const pkg = await this.prisma.package.findUnique({ where: { type } });
    if (!pkg) throw new NotFoundException('Package not found');
    return this.toResponse(pkg);
  }

  // Decimal → number so the catalog serialises cleanly for the mobile client.
  private toResponse(p: Package) {
    return {
      type: p.type,
      name: p.name,
      tagline: p.tagline,
      priceGhs: p.priceGhs.toNumber(),
      inclusions: p.inclusions,
    };
  }
}
