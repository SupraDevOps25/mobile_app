export type ServiceCategory = {
  id: string;
  title: string;
  count: number;
  iconName: string;
  bgColor: string;
  iconColor: string;
};

export type Caregiver = {
  id: string;
  name: string;
  role: string;
  yearsExp: number;
  rating: number;
  availability: "today" | "tomorrow";
  initials: string;
  avatarColor: string;
};

export type Review = {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerColor: string;
  date: string;
  text: string;
};

export type WeekDay = {
  short: string;
  available: boolean;
};

export type CaregiverDetail = Caregiver & {
  location: string;
  distanceKm: number;
  reviewCount: number;
  visitsDone: number;
  responseTimeMin: number;
  hourlyRate: number;
  bio: string;
  services: string[];
  weeklyAvailability: WeekDay[];
  reviews: Review[];
};

export const SERVICES: ServiceCategory[] = [
  {
    id: "1",
    title: "Chronic disease care",
    count: 12,
    iconName: "stethoscope",
    bgColor: "#EEF2FF",
    iconColor: "#6366f1",
  },
  {
    id: "2",
    title: "Elderly care",
    count: 18,
    iconName: "human-cane",
    bgColor: "#F0FDF4",
    iconColor: "#22c55e",
  },
  {
    id: "3",
    title: "Wound care",
    count: 9,
    iconName: "bandage",
    bgColor: "#FFF7ED",
    iconColor: "#f97316",
  },
  {
    id: "4",
    title: "Post-hospital recovery",
    count: 14,
    iconName: "heart-pulse",
    bgColor: "#F5F3FF",
    iconColor: "#8b5cf6",
  },
];

export const NEARBY_CAREGIVERS: Caregiver[] = [
  {
    id: "1",
    name: "Abena Mensah",
    role: "Registered Nurse",
    yearsExp: 8,
    rating: 4.9,
    availability: "today",
    initials: "AM",
    avatarColor: "#3b82f6",
  },
  {
    id: "2",
    name: "Kwame Osei",
    role: "Physiotherapist",
    yearsExp: 8,
    rating: 4.7,
    availability: "today",
    initials: "KO",
    avatarColor: "#1e40af",
  },
  {
    id: "3",
    name: "Esi Agyemang",
    role: "Elder Care Specialist",
    yearsExp: 4,
    rating: 4.9,
    availability: "tomorrow",
    initials: "EA",
    avatarColor: "#4f46e5",
  },
  {
    id: "4",
    name: "Kwaku Frimpong",
    role: "Registered Nurse",
    yearsExp: 6,
    rating: 4.8,
    availability: "tomorrow",
    initials: "KF",
    avatarColor: "#d97706",
  },
];

const WEEK: WeekDay[] = [
  { short: "Mon", available: true },
  { short: "Tue", available: true },
  { short: "Wed", available: false },
  { short: "Thu", available: true },
  { short: "Fri", available: true },
  { short: "Sat", available: true },
  { short: "Sun", available: false },
];

export const CAREGIVER_DETAILS: Record<string, CaregiverDetail> = {
  "1": {
    id: "1",
    name: "Abena Mensah",
    role: "Registered Nurse",
    yearsExp: 5,
    rating: 4.9,
    availability: "today",
    initials: "AM",
    avatarColor: "#3b82f6",
    location: "East Legon, Accra",
    distanceKm: 3.2,
    reviewCount: 84,
    visitsDone: 142,
    responseTimeMin: 15,
    hourlyRate: 60,
    bio: "Registered nurse with 5 years of experience in chronic disease management and post-surgical recovery. Passionate about delivering compassionate, patient-centred care in the home setting.",
    services: [
      "Chronic Disease Care",
      "Wound Care",
      "Medication Support",
      "Elderly Care",
      "BP Monitoring",
      "Catheter Care",
    ],
    weeklyAvailability: WEEK,
    reviews: [
      {
        id: "r1",
        reviewerName: "Kofi A.",
        reviewerInitials: "KA",
        reviewerColor: "#3b82f6",
        date: "12 May 2025",
        text: "Abena was incredibly professional and caring with my father. She arrived on time and made him feel at ease immediately.",
      },
      {
        id: "r2",
        reviewerName: "Efua B.",
        reviewerInitials: "EB",
        reviewerColor: "#10b981",
        date: "3 May 2025",
        text: "Very skilled and attentive. Wound dressing was done perfectly. Will definitely book again.",
      },
    ],
  },
  "2": {
    id: "2",
    name: "Kwame Osei",
    role: "Physiotherapist",
    yearsExp: 8,
    rating: 4.7,
    availability: "today",
    initials: "KO",
    avatarColor: "#1e40af",
    location: "Cantonments, Accra",
    distanceKm: 5.1,
    reviewCount: 61,
    visitsDone: 98,
    responseTimeMin: 20,
    hourlyRate: 75,
    bio: "Experienced physiotherapist specialising in stroke rehabilitation and post-operative recovery. Committed to restoring mobility and improving quality of life for patients at home.",
    services: [
      "Physiotherapy",
      "Stroke Rehabilitation",
      "Post-op Recovery",
      "Mobility Training",
      "Pain Management",
    ],
    weeklyAvailability: [
      { short: "Mon", available: true },
      { short: "Tue", available: false },
      { short: "Wed", available: true },
      { short: "Thu", available: true },
      { short: "Fri", available: false },
      { short: "Sat", available: true },
      { short: "Sun", available: true },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "Ama S.",
        reviewerInitials: "AS",
        reviewerColor: "#8b5cf6",
        date: "20 Apr 2025",
        text: "Kwame helped my mother regain movement after her stroke. Incredibly patient and professional.",
      },
      {
        id: "r2",
        reviewerName: "Yaw B.",
        reviewerInitials: "YB",
        reviewerColor: "#f97316",
        date: "8 Apr 2025",
        text: "Great physiotherapist. My father's recovery has improved significantly since he started sessions.",
      },
    ],
  },
  "3": {
    id: "3",
    name: "Esi Agyemang",
    role: "Elder Care Specialist",
    yearsExp: 4,
    rating: 4.9,
    availability: "tomorrow",
    initials: "EA",
    avatarColor: "#4f46e5",
    location: "Labone, Accra",
    distanceKm: 2.8,
    reviewCount: 47,
    visitsDone: 73,
    responseTimeMin: 10,
    hourlyRate: 55,
    bio: "Dedicated elder care specialist with 4 years of experience supporting older adults with daily living activities. Known for warmth, patience, and a genuine connection with clients.",
    services: [
      "Elderly Care",
      "Daily Living Support",
      "Medication Reminders",
      "Companionship",
      "Dementia Care",
    ],
    weeklyAvailability: [
      { short: "Mon", available: false },
      { short: "Tue", available: true },
      { short: "Wed", available: true },
      { short: "Thu", available: false },
      { short: "Fri", available: true },
      { short: "Sat", available: true },
      { short: "Sun", available: true },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "Akua D.",
        reviewerInitials: "AD",
        reviewerColor: "#ec4899",
        date: "15 May 2025",
        text: "Esi is wonderful with my grandmother. She's always on time and treats her with so much respect.",
      },
      {
        id: "r2",
        reviewerName: "Nana O.",
        reviewerInitials: "NO",
        reviewerColor: "#14b8a6",
        date: "2 May 2025",
        text: "Very caring and attentive. My father enjoys her company and his health has improved greatly.",
      },
    ],
  },
  "4": {
    id: "4",
    name: "Kwaku Frimpong",
    role: "Registered Nurse",
    yearsExp: 6,
    rating: 4.8,
    availability: "tomorrow",
    initials: "KF",
    avatarColor: "#d97706",
    location: "Adenta, Accra",
    distanceKm: 7.4,
    reviewCount: 55,
    visitsDone: 110,
    responseTimeMin: 18,
    hourlyRate: 65,
    bio: "Registered nurse with 6 years of clinical and home care experience. Specialises in wound management and chronic disease monitoring. Focused on patient dignity and family education.",
    services: [
      "Wound Care",
      "Chronic Disease Care",
      "IV Therapy",
      "Medication Support",
      "BP Monitoring",
    ],
    weeklyAvailability: [
      { short: "Mon", available: true },
      { short: "Tue", available: true },
      { short: "Wed", available: true },
      { short: "Thu", available: false },
      { short: "Fri", available: true },
      { short: "Sat", available: false },
      { short: "Sun", available: false },
    ],
    reviews: [
      {
        id: "r1",
        reviewerName: "Abena K.",
        reviewerInitials: "AK",
        reviewerColor: "#d97706",
        date: "18 May 2025",
        text: "Kwaku managed my husband's wound care with great skill. Very professional and thorough.",
      },
      {
        id: "r2",
        reviewerName: "Kofi M.",
        reviewerInitials: "KM",
        reviewerColor: "#6366f1",
        date: "10 May 2025",
        text: "Reliable and knowledgeable. Always explains what he is doing which gives us peace of mind.",
      },
    ],
  },
};
