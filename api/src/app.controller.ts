import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Liveness — a cheap 200 with no I/O. Use this as Render's health-check path
  // so a hung DB never trips a needless restart.
  @Get('health')
  health() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  // Readiness — also pings Postgres. Point your keep-alive pinger here so a
  // scheduled request warms BOTH the web service and Neon (whose free-tier
  // compute suspends after ~5 min idle).
  @Get('health/ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }
}
