import 'dotenv/config';
import {
  Competency,
  PackageType,
  PrismaClient,
  Role,
  VerificationStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Mirror the app's client construction (Prisma 7 driver adapter).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Shared password for all seeded demo accounts.
const DEMO_PASSWORD = 'Password123';

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

// Verified, available demo nurses — varied experience / areas / reliability so
// the matching ranking is observable. Competencies are for profile display;
// matching ranks on experience, availability, proximity, reliability, continuity.
const NURSES: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  qualification: string;
  yearsExperience: number;
  serviceAreas: string[];
  reliabilityScore: number;
  rating: number;
  totalReviews: number;
  competencies: Competency[];
}[] = [
  {
    email: 'abena.mensah@supracarer.com',
    phone: '+233200000010',
    firstName: 'Abena',
    lastName: 'Mensah',
    qualification: 'Registered Nurse',
    yearsExperience: 8,
    serviceAreas: ['East Legon', 'Airport', 'Cantonments'],
    reliabilityScore: 97,
    rating: 4.9,
    totalReviews: 124,
    competencies: [
      Competency.PERSONAL_CARE,
      Competency.HYPERTENSION,
      Competency.DIABETES,
      Competency.MEDICATION,
      Competency.VITALS,
      Competency.GERIATRIC,
    ],
  },
  {
    email: 'kwaku.frimpong@supracarer.com',
    phone: '+233200000011',
    firstName: 'Kwaku',
    lastName: 'Frimpong',
    qualification: 'Registered Nurse',
    yearsExperience: 6,
    serviceAreas: ['East Legon', 'Adenta'],
    reliabilityScore: 93,
    rating: 4.8,
    totalReviews: 88,
    competencies: [
      Competency.PERSONAL_CARE,
      Competency.MOBILITY,
      Competency.MEDICATION,
      Competency.VITALS,
      Competency.GERIATRIC,
    ],
  },
  {
    email: 'esi.agyemang@supracarer.com',
    phone: '+233200000012',
    firstName: 'Esi',
    lastName: 'Agyemang',
    qualification: 'Elder Care Specialist',
    yearsExperience: 4,
    serviceAreas: ['East Legon', 'Madina'],
    reliabilityScore: 90,
    rating: 4.9,
    totalReviews: 56,
    competencies: [
      Competency.PERSONAL_CARE,
      Competency.HYGIENE,
      Competency.FEEDING,
      Competency.MOBILITY,
      Competency.GERIATRIC,
    ],
  },
  {
    email: 'yaw.boateng@supracarer.com',
    phone: '+233200000013',
    firstName: 'Yaw',
    lastName: 'Boateng',
    qualification: 'Registered Nurse',
    yearsExperience: 10,
    serviceAreas: ['Osu', 'Labone', 'Cantonments'],
    reliabilityScore: 88,
    rating: 4.7,
    totalReviews: 140,
    competencies: [
      Competency.WOUND_CARE,
      Competency.CATHETER_CARE,
      Competency.CHRONIC_DISEASE,
      Competency.MEDICATION,
      Competency.VITALS,
    ],
  },
  {
    email: 'ama.darko@supracarer.com',
    phone: '+233200000014',
    firstName: 'Ama',
    lastName: 'Darko',
    qualification: 'Registered Nurse',
    yearsExperience: 2,
    serviceAreas: ['Tema', 'Spintex'],
    reliabilityScore: 80,
    rating: 4.5,
    totalReviews: 22,
    competencies: [
      Competency.PERSONAL_CARE,
      Competency.VITALS,
      Competency.MEDICATION,
    ],
  },
];

async function seedPackages() {
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

async function seedCoordinator(passwordHash: string) {
  await prisma.user.upsert({
    where: { email: 'coordinator@supracarer.com' },
    update: {},
    create: {
      email: 'coordinator@supracarer.com',
      phone: '+233200000001',
      password: passwordHash,
      firstName: 'Efua',
      lastName: 'Owusu',
      role: Role.CARE_COORDINATOR,
      emailVerified: true,
    },
  });
  console.log('Seeded 1 care coordinator.');
}

async function seedNurses(passwordHash: string) {
  for (const n of NURSES) {
    const user = await prisma.user.upsert({
      where: { email: n.email },
      update: {},
      create: {
        email: n.email,
        phone: n.phone,
        password: passwordHash,
        firstName: n.firstName,
        lastName: n.lastName,
        role: Role.CAREGIVER,
        emailVerified: true,
      },
    });

    const profileData = {
      qualification: n.qualification,
      yearsExperience: n.yearsExperience,
      competencies: n.competencies,
      serviceAreas: n.serviceAreas,
      licenseVerified: true,
      isAvailable: true,
      verificationStatus: VerificationStatus.VERIFIED,
      rating: n.rating,
      reliabilityScore: n.reliabilityScore,
      totalReviews: n.totalReviews,
    };

    await prisma.caregiverProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: { userId: user.id, ...profileData },
    });
  }
  console.log(`Seeded ${NURSES.length} verified, available nurses.`);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await seedPackages();
  await seedCoordinator(passwordHash);
  await seedNurses(passwordHash);
  console.log(`\nDemo login password for all seeded accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
