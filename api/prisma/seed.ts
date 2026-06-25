import 'dotenv/config';
import { PrismaClient, PackageType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Mirror the app's client construction (Prisma 7 driver adapter).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The package catalog — kept in sync with the mobile app
// (mobile/constants/packages.ts).
const PACKAGES: {
  type: PackageType;
  name: string;
  tagline: string;
  priceGhs: number;
  inclusions: string[];
}[] = [
  {
    type: PackageType.WELLNESS,
    name: 'Wellness Visits',
    tagline: '4 visits per month',
    priceGhs: 640,
    inclusions: [
      'Blood pressure monitoring',
      'Blood glucose monitoring',
      'Medication reminders',
      'Wellness assessment',
      'Nutrition guidance',
      'Monthly family update',
      'Clinical oversight by Supracarer',
    ],
  },
  {
    type: PackageType.DAILY_ASSIST,
    name: 'Daily Assist',
    tagline: '8-hour shift · 26 days/month',
    priceGhs: 4160,
    inclusions: [
      'Personal care assistance',
      'Hygiene support',
      'Feeding assistance',
      'Mobility support',
      'Medication reminders',
      'Health monitoring',
      'Companionship',
      'Safety supervision',
      'Weekly family updates',
      'Clinical oversight by Supracarer',
    ],
  },
  {
    type: PackageType.EXTENDED_ASSIST,
    name: 'Extended Assist',
    tagline: '12-hour shift · 26 days/month',
    priceGhs: 4940,
    inclusions: [
      'Everything in Daily Assist',
      'Wound care support',
      'Catheter care support',
      'Chronic disease monitoring',
      'Rehabilitation support',
      'Enhanced nursing assessment',
      'Escalation management',
      'Extended daytime and evening coverage',
      'Bi-weekly care reviews',
      'Clinical oversight by Supracarer',
    ],
  },
  {
    type: PackageType.LIVE_IN,
    name: 'Live-In Care',
    tagline: '24-hour support · 30 days/month',
    priceGhs: 7800,
    inclusions: [
      'Continuous day and night supervision',
      'Personal care assistance',
      'Daily living support',
      'Medication management',
      'Health monitoring',
      'Emergency response support',
      'Weekly family briefings',
      'Ongoing care plan reviews',
      'Clinical oversight by Supracarer',
    ],
  },
];

async function main() {
  for (const pkg of PACKAGES) {
    await prisma.package.upsert({
      where: { type: pkg.type },
      update: {
        name: pkg.name,
        tagline: pkg.tagline,
        priceGhs: pkg.priceGhs,
        inclusions: pkg.inclusions,
      },
      create: pkg,
    });
  }
  console.log(`Seeded ${PACKAGES.length} packages.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
