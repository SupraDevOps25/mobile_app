import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Package, PackageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

// Admin catalog management. The package `type` is a fixed enum, so this is
// really: edit the presentation/price of the packages, (re)create one that's
// missing, and remove one from the catalog.
@Injectable()
export class AdminPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const packages = await this.prisma.package.findMany({
      orderBy: { priceGhs: 'asc' },
    });
    return packages.map((p) => this.toResponse(p));
  }

  async create(dto: CreatePackageDto) {
    const existing = await this.prisma.package.findUnique({
      where: { type: dto.type },
    });
    if (existing) {
      throw new ConflictException(
        `A ${dto.type} package already exists — edit it instead.`,
      );
    }

    const created = await this.prisma.package.create({
      data: {
        type: dto.type,
        name: dto.name.trim(),
        tagline: dto.tagline.trim(),
        priceGhs: dto.priceGhs,
        inclusions: dto.inclusions.map((i) => i.trim()).filter(Boolean),
      },
    });
    return this.toResponse(created);
  }

  async update(type: PackageType, dto: UpdatePackageDto) {
    await this.requirePackage(type);

    const updated = await this.prisma.package.update({
      where: { type },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline.trim() }),
        ...(dto.priceGhs !== undefined && { priceGhs: dto.priceGhs }),
        ...(dto.inclusions !== undefined && {
          inclusions: dto.inclusions.map((i) => i.trim()).filter(Boolean),
        }),
      },
    });
    return this.toResponse(updated);
  }

  async remove(type: PackageType) {
    await this.requirePackage(type);
    await this.prisma.package.delete({ where: { type } });
    return { deleted: true, type };
  }

  private async requirePackage(type: PackageType) {
    const pkg = await this.prisma.package.findUnique({ where: { type } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  private toResponse(p: Package) {
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      tagline: p.tagline,
      priceGhs: p.priceGhs.toNumber(),
      inclusions: p.inclusions,
    };
  }
}
