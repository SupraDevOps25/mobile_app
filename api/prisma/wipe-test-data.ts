/**
 * Wipe test data before real onboarding.
 *
 * KEEPS: care coordinator + admin accounts (and their profiles), and the
 * package catalog. DELETES: all families, nurses, and everything tied to
 * them — subscriptions, visits, logs, assignments, payments, payouts, reviews,
 * messages, care recipients, addresses, payment methods, documents — plus all
 * notifications (transient).
 *
 * DESTRUCTIVE and irreversible. It runs against whatever DATABASE_URL is set,
 * so it's guarded: it only proceeds when CONFIRM=WIPE is set.
 *
 *   # dry run — shows what would be kept/deleted, changes nothing
 *   npx ts-node prisma/wipe-test-data.ts
 *
 *   # actually wipe
 *   CONFIRM=WIPE npx ts-node prisma/wipe-test-data.ts
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Mirror the app's client construction (Prisma 7 driver adapter).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function maskedHost(): string {
  const url = process.env.DATABASE_URL ?? '';
  const m = url.match(/@([^/:]+)/);
  return m ? m[1] : '(unknown host)';
}

async function main() {
  const confirmed = process.env.CONFIRM === 'WIPE';

  const [coordinators, admins, packages, families, caregivers, subscriptions] =
    await Promise.all([
      prisma.user.count({ where: { role: Role.CARE_COORDINATOR } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.package.count(),
      prisma.user.count({ where: { role: Role.FAMILY } }),
      prisma.user.count({ where: { role: Role.CAREGIVER } }),
      prisma.subscription.count(),
    ]);

  console.log(`\nTarget database host: ${maskedHost()}`);
  console.log('\nKEEP:');
  console.log(`  • ${coordinators} coordinator account(s)`);
  console.log(`  • ${admins} admin account(s)`);
  console.log(`  • ${packages} package(s) in the catalog`);
  console.log('\nDELETE:');
  console.log(`  • ${families} family account(s)`);
  console.log(`  • ${caregivers} nurse account(s)`);
  console.log(`  • ${subscriptions} subscription(s) + all related data`);
  console.log('  • all notifications');

  if (!confirmed) {
    console.log(
      '\nDry run — nothing was changed. Re-run with CONFIRM=WIPE to proceed.\n',
    );
    return;
  }

  console.log('\nCONFIRM=WIPE set — deleting…\n');

  // Leaf → root, so foreign keys without cascade (Visit/Assignment → caregiver,
  // Payment → subscription/family) never block a delete. Deleting the FAMILY and
  // CAREGIVER users last cascades their profiles, care recipients, addresses,
  // payment methods and documents.
  const steps: [string, () => Promise<{ count: number }>][] = [
    ['visit logs', () => prisma.visitLog.deleteMany()],
    ['visits', () => prisma.visit.deleteMany()],
    ['nurse payout requests', () => prisma.payoutRequest.deleteMany()],
    [
      'coordinator payout requests',
      () => prisma.coordinatorPayoutRequest.deleteMany(),
    ],
    ['payments', () => prisma.payment.deleteMany()],
    ['reviews', () => prisma.review.deleteMany()],
    ['messages', () => prisma.message.deleteMany()],
    ['assignments', () => prisma.assignment.deleteMany()],
    ['subscriptions', () => prisma.subscription.deleteMany()],
    ['notifications', () => prisma.notification.deleteMany()],
    [
      'family + nurse accounts',
      () =>
        prisma.user.deleteMany({
          where: { role: { in: [Role.FAMILY, Role.CAREGIVER] } },
        }),
    ],
  ];

  for (const [label, run] of steps) {
    const { count } = await run();
    console.log(`  ✓ deleted ${count} ${label}`);
  }

  console.log('\nDone. Coordinators, admins and the package catalog remain.\n');
}

main()
  .catch((err) => {
    console.error('\nWipe failed:', err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
