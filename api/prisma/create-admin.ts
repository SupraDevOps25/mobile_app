/**
 * Create an ADMIN account (needed for the visit-status override and custom-care
 * request emails). Idempotent: refuses to clobber an existing email/phone.
 *
 * Details come from env vars; ADMIN_PASSWORD is required (no default, so an
 * admin never ships with a guessable password):
 *
 *   ADMIN_EMAIL=admin@supracarer.com \
 *   ADMIN_PASSWORD='a-strong-password' \
 *   ADMIN_PHONE=+233200000000 \
 *   ADMIN_FIRST=Supracarer ADMIN_LAST=Admin \
 *   npx ts-node prisma/create-admin.ts
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@supracarer.com').trim();
  const password = process.env.ADMIN_PASSWORD;
  const phone = (process.env.ADMIN_PHONE ?? '+233200000000').trim();
  const firstName = (process.env.ADMIN_FIRST ?? 'Supracarer').trim();
  const lastName = (process.env.ADMIN_LAST ?? 'Admin').trim();

  if (!password || password.length < 8) {
    console.error(
      '\nSet ADMIN_PASSWORD (min 8 chars) — e.g.\n' +
        "  ADMIN_EMAIL=admin@supracarer.com ADMIN_PASSWORD='strong-pass' npx ts-node prisma/create-admin.ts\n",
    );
    process.exitCode = 1;
    return;
  }

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true, role: true },
  });
  if (clash) {
    console.error(
      `\nAn account already uses that ${clash.email === email ? 'email' : 'phone'} (role ${clash.role}). ` +
        'Pick a different one or delete it first — not overwriting.\n',
    );
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      email,
      phone,
      password: passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      emailVerified: true,
    },
    select: { id: true, email: true },
  });

  console.log(`\nCreated admin ${admin.email} (id ${admin.id}).\n`);
}

main()
  .catch((err) => {
    console.error('\nCreate admin failed:', err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
