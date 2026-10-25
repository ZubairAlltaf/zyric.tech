export type Plan = "free" | "premium";

export interface ToolFeature {
  name: string;
  plan: Plan;
}

export interface PricingItem {
  duration: string;
  price: string;
}

export interface ToolLink {
  label: string;
  url: string;
  kind: "web" | "android" | "site";
}

export interface Tool {
  id: string;
  kind: "tool" | "ecosystem";
  name: string;
  nameBn: string;
  tagline: string;
  description: string;
  longDescription: string;
  categories: string[];
  freeType: "completely-free" | "freemium" | "paid" | "donation";
  platforms: ("web" | "android")[];
  rating?: { value: string; count: string };
  downloads?: string;
  students?: string;
  links: ToolLink[];
  features: ToolFeature[];
  premiumNote?: string;
  pricing?: PricingItem[];
  accent: "emerald" | "amber" | "teal" | "cyan" | "violet" | "rose";
  featured?: boolean;
}

export const CATEGORY_LABELS = [
  "Finance",
  "Business",
  "Islamic",
  "Community",
  "Learning",
] as const;

export const TOOLS: Tool[] = [
  {
    id: "aybay",
    kind: "tool",
    name: "AyBay — Income & Expense Tracker",
    nameBn: "আয় ব্যয়",
    tagline: "Track daily income & expenses the effortless way",
    description:
      "A beautifully simple personal finance app for everyday Bangladeshi users. Log every taka of income and spending, keep it organized, safe, and always understandable.",
    longDescription:
      "AyBay (আয় ব্যয়) is Qamarix's flagship personal finance app — 50,000+ downloads and rated 4.4 stars from 3,000+ reviews on Google Play. The free tier covers nearly everything a personal user needs: day-to-day logging, monthly reports, budgets, savings goals, debt tracking, and even task reminders. It works both as an Android app and a full web app at aybay.qamarix.com, with multi-account and wallet support, home-screen widgets, fingerprint/PIN security, and dark mode. Premium (from ৳290/year) removes ads and unlocks unlimited transactions, with family plans covering up to 5 members.",
    categories: ["Finance"],
    freeType: "freemium",
    platforms: ["web", "android"],
    rating: { value: "4.4", count: "3,000+" },
    downloads: "50,000+",
    links: [
      { label: "Open Web App", url: "https://aybay.qamarix.com/", kind: "web" },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.my_ay_bay.my_ay_bay",
        kind: "android",
      },
      { label: "Product Page", url: "https://qamarix.com/products/aybay", kind: "site" },
    ],
    features: [
      { name: "Income & expense tracking", plan: "free" },
      { name: "Monthly reports", plan: "free" },
      { name: "Income-expense filters", plan: "free" },
      { name: "Percentage bars", plan: "free" },
      { name: "Multi-account support", plan: "free" },
      { name: "Quick entry", plan: "free" },
      { name: "Repeat transactions", plan: "free" },
      { name: "Debt (due) tracking", plan: "free" },
      { name: "Income-expense graphs", plan: "free" },
      { name: "Savings tracker", plan: "free" },
      { name: "Budget management", plan: "free" },
      { name: "Custom reports", plan: "free" },
      { name: "Wallet feature", plan: "free" },
      { name: "Notes", plan: "free" },
      { name: "Task management & reminders", plan: "free" },
      { name: "Fingerprint & security PIN", plan: "free" },
      { name: "App bar themes", plan: "free" },
      { name: "Home screen widget", plan: "free" },
      { name: "Dark mode", plan: "free" },
      { name: "Ad-free experience", plan: "premium" },
      { name: "Unlimited transactions", plan: "premium" },
    ],
    premiumNote: "Premium removes ads and unlocks unlimited transactions.",
    pricing: [
      { duration: "1 year", price: "৳290" },
      { duration: "10 years", price: "৳1,490" },
      { duration: "One-time purchase", price: "৳1,990" },
      { duration: "Family 1 year (5 members)", price: "৳1,160" },
      { duration: "Family one-time (5 members)", price: "৳7,960" },
    ],
    accent: "emerald",
    featured: true,
  },
  {
    id: "hishab",
    kind: "tool",
    name: "Hishab — Business Accounting",
    nameBn: "হিসাব",
    tagline: "Your shop's accounting, stock & invoicing in one app",
    description:
      "A simple accounting and management solution for Bangladeshi shops and small businesses — products, transactions, customer management, and SMS notifications, all in one app.",
    longDescription:
      "Hishab (হিসাব) is Qamarix's business accounting app for shops and small businesses in Bangladesh. The free tier lets you record sales and expenses, manage customers, track dues (বাকি) and payments, and pull daily and monthly reports. You can run multiple businesses from one account, send SMS reminders to customers, and export or back up your data. Premium (from ৳190 for 3 months) adds an ad-free experience; a ৳550/year plan and a ৳6,400 one-time lifetime purchase are also available. Currently available on Android via Google Play.",
    categories: ["Business", "Finance"],
    freeType: "freemium",
    platforms: ["android"],
    rating: { value: "3.9", count: "20+" },
    downloads: "1,000+",
    links: [
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.qamarix.hishab",
        kind: "android",
      },
      { label: "Product Page", url: "https://qamarix.com/products/hishab", kind: "site" },
    ],
    features: [
      { name: "Sales & expense recording", plan: "free" },
      { name: "Customer management", plan: "free" },
      { name: "Due & payment tracking", plan: "free" },
      { name: "Daily / monthly reports", plan: "free" },
      { name: "Multiple business support", plan: "free" },
      { name: "SMS reminders", plan: "free" },
      { name: "Export & backup", plan: "free" },
      { name: "Ad-free experience", plan: "premium" },
    ],
    premiumNote: "Premium removes ads for a cleaner, faster workflow.",
    pricing: [
      { duration: "3 months", price: "৳190" },
      { duration: "1 year", price: "৳550" },
      { duration: "One-time purchase", price: "৳6,400" },
    ],
    accent: "cyan",
  },
  {
    id: "quran-words",
    kind: "tool",
    name: "Quran Words",
    nameBn: "কুরআন ওয়ার্ডস",
    tagline: "Understand ~70% of the Quran with just 500 words",
    description:
      "Learn the 500 most frequent Arabic words in the Quran — Bengali meanings, real verses, quizzes, streaks, and progress tracking. Completely free, no subscription.",
    longDescription:
      "Quran Words (কুরআন ওয়ার্ডস) makes Quranic Arabic approachable: master the 500 most common words and you can understand roughly 70% of the Quran's meaning. Each of the 100 lessons teaches 5 words with Bengali meanings and the real Quranic verses where they appear. Quizzes, hearts, and daily streaks keep you consistent, all levels track your progress, and optional Google sign-in syncs across devices. The team's promise: সম্পূর্ণ ফ্রি — completely free, no subscription, ever. Available on the web at quranwords.qamarix.com and on Google Play.",
    categories: ["Islamic", "Learning"],
    freeType: "completely-free",
    platforms: ["web", "android"],
    downloads: "100+",
    links: [
      { label: "Open Web App", url: "https://quranwords.qamarix.com/", kind: "web" },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.qamarix.quran_words",
        kind: "android",
      },
      { label: "Product Page", url: "https://qamarix.com/products/quran-words", kind: "site" },
    ],
    features: [
      { name: "500+ most frequent Quranic Arabic words", plan: "free" },
      { name: "Bengali meanings + real Quranic verses", plan: "free" },
      { name: "100 lessons — 5 words per lesson", plan: "free" },
      { name: "Quizzes to reinforce memory", plan: "free" },
      { name: "Hearts & daily streaks", plan: "free" },
      { name: "Progress tracking across all levels", plan: "free" },
      { name: "Optional Google progress sync", plan: "free" },
      { name: "No subscription — free forever", plan: "free" },
    ],
    accent: "amber",
    featured: true,
  },
  {
    id: "community",
    kind: "tool",
    name: "Qamarix Community",
    nameBn: "কমিউনিটি",
    tagline: "Tips, questions & updates for every Qamarix app",
    description:
      "A free community platform where users share tips, ask questions, and post experiences about AyBay, Hishab, Quran Words, and other Qamarix products.",
    longDescription:
      "The Qamarix Community (qamarix.com/community) is a free social platform built around the ecosystem's apps. Members post tips, ask product questions, share their experiences, and stay up to date with announcements. Activity earns points that feed the monthly leaderboard — posting, commenting, liking, watching videos, and referring friends all count. It is the fastest place to get help with any Qamarix app, straight from power users and the team.",
    categories: ["Community"],
    freeType: "completely-free",
    platforms: ["web"],
    links: [
      { label: "Join Community", url: "https://qamarix.com/community", kind: "site" },
      { label: "Join via Link", url: "https://qamarix.com/community/join", kind: "site" },
    ],
    features: [
      { name: "Free account with posts & comments", plan: "free" },
      { name: "Tips & help for all Qamarix apps", plan: "free" },
      { name: "Product update announcements", plan: "free" },
      { name: "Points for posts, likes & referrals", plan: "free" },
      { name: "Monthly leaderboard ranking", plan: "free" },
    ],
    accent: "violet",
  },
  {
    id: "videos",
    kind: "tool",
    name: "Video Tutorials",
    nameBn: "ভিডিও টিউটোরিয়াল",
    tagline: "Step-by-step Bengali tutorials for every app",
    description:
      "A free library of Bengali video tutorials — learn how to use AyBay, Hishab, Quran Words, and the Academy, step by step.",
    longDescription:
      "The Video Tutorials hub (qamarix.com/videos) is a free, growing library of Bengali-language walkthroughs for the entire Qamarix ecosystem. Tutorials cover the four ways to log into AyBay, setting a security PIN, adding the home-screen widget, downloading and customizing reports, multi-account usage, savings tracking, budget management, debt tracking, filters, the repeat feature, categories, the SMS feature, and newer additions like the trash feature — plus Quran Words and Hishab walkthroughs. Watching videos even earns community points.",
    categories: ["Learning", "Community"],
    freeType: "completely-free",
    platforms: ["web"],
    links: [{ label: "Watch Tutorials", url: "https://qamarix.com/videos", kind: "site" }],
    features: [
      { name: "AyBay full walkthrough series", plan: "free" },
      { name: "Hishab & Quran Words tutorials", plan: "free" },
      { name: "Bengali language, step by step", plan: "free" },
      { name: "Tips: PIN, widgets, reports, budgets", plan: "free" },
      { name: "Earn community points for watching", plan: "free" },
    ],
    accent: "teal",
  },
  {
    id: "leaderboard",
    kind: "tool",
    name: "Monthly Leaderboard",
    nameBn: "লিডারবোর্ড",
    tagline: "The community's most active members, every month",
    description:
      "A free monthly ranking of the Qamarix community's most active members — points from posts, comments, likes, video views, and referrals.",
    longDescription:
      "The Qamarix Leaderboard (qamarix.com/leaderboard) ranks the community's most active members every month. Points are earned from posting, commenting, liking, watching tutorial videos, and referring new users — all free actions. It gamifies participation in the ecosystem and spotlights top contributors each month. Pair it with the Community platform for the full experience.",
    categories: ["Community"],
    freeType: "completely-free",
    platforms: ["web"],
    links: [
      { label: "View Leaderboard", url: "https://qamarix.com/leaderboard", kind: "site" },
    ],
    features: [
      { name: "Monthly rankings, reset each month", plan: "free" },
      { name: "Points: posts, comments, likes, videos, referrals", plan: "free" },
      { name: "Spotlight for top contributors", plan: "free" },
      { name: "Fully free to participate", plan: "free" },
    ],
    accent: "rose",
  },
  {
    id: "academy",
    kind: "ecosystem",
    name: "Qamarix Academy",
    nameBn: "কমারিক্স একাডেমি",
    tagline: "Professional Bengali courses: Flutter, AI & design",
    description:
      "Bangladesh's Bengali-language learning platform for Flutter app development, AI-powered e-commerce development with Cursor, and mobile graphic design — real projects, certificates, lifetime access.",
    longDescription:
      "Qamarix Academy (academy.qamarix.com) is a Bengali online learning platform with structured video lessons built around real-world projects. Courses currently include the complete Flutter App Development course, building a full e-commerce app with Cursor AI, and Mobile Graphic Design. Every course includes HD video lessons, downloadable resources, a completion certificate, lifetime access, a Discord community, and regular updates. Rated 5.0 from 100+ reviews by 500+ students. Courses are paid — from ৳360 — but the Academy frequently discounts (e.g. Flutter course down from ৳4,000 to ৳1,990).",
    categories: ["Learning"],
    freeType: "paid",
    platforms: ["web"],
    students: "500+ students · ★5.0 (100+)",
    links: [
      { label: "Visit Academy", url: "https://academy.qamarix.com", kind: "site" },
      {
        label: "Flutter Course",
        url: "https://academy.qamarix.com/courses/flutterappdevcourse",
        kind: "site",
      },
      {
        label: "Cursor AI Course",
        url: "https://academy.qamarix.com/courses/aiappcourse",
        kind: "site",
      },
      {
        label: "Graphic Design",
        url: "https://academy.qamarix.com/courses/mobilegraphiccourse",
        kind: "site",
      },
    ],
    features: [
      { name: "Flutter App Development course", plan: "premium" },
      { name: "E-commerce app with Cursor AI", plan: "premium" },
      { name: "Mobile graphic design course", plan: "premium" },
      { name: "Real project-based learning", plan: "premium" },
      { name: "HD video lessons", plan: "premium" },
      { name: "Downloadable resources", plan: "premium" },
      { name: "Completion certificates", plan: "premium" },
      { name: "Lifetime access + Discord community", plan: "premium" },
    ],
    premiumNote: "Paid courses — one-time purchase per course, lifetime access.",
    pricing: [
      { duration: "Flutter App Development", price: "৳1,990 (was ৳4,000)" },
      { duration: "E-commerce with Cursor AI", price: "৳360 (was ৳990)" },
      { duration: "Mobile Graphic Design", price: "৳499 (was ৳799)" },
    ],
    accent: "violet",
  },
  {
    id: "comarix-ad",
    kind: "ecosystem",
    name: "Comarix Ad",
    nameBn: "কমারিক্স এড",
    tagline: "100% halal advertising across Qamarix apps",
    description:
      "A manually-reviewed, halal-focused ad ecosystem for Bangladeshi businesses — banner and full-screen ads across 50,000+ app downloads, with transparent day-based pricing.",
    longDescription:
      "Comarix Ad is Qamarix's advertising ecosystem for halal businesses. Every ad is manually reviewed before going live — no alcohol, gambling, interest-based financial services, or inappropriate content. Advertisers get banner and full-screen ad formats across all Qamarix apps (50,000+ combined downloads), a campaign dashboard, safe online payments via PipraPay, and transparent pricing: total = daily rate × days × priority, starting from just 1 day. Rated 5.0 by 50+ advertisers. This is a paid product aimed at businesses, not end users.",
    categories: ["Business"],
    freeType: "paid",
    platforms: ["web"],
    rating: { value: "5.0", count: "50+" },
    links: [
      { label: "Advertise Here", url: "https://qamarix.com/products/comarix-ad", kind: "site" },
    ],
    features: [
      { name: "100% halal ad ecosystem", plan: "premium" },
      { name: "Manual review before every campaign", plan: "premium" },
      { name: "Banner & full-screen formats", plan: "premium" },
      { name: "Reach 50,000+ app users", plan: "premium" },
      { name: "PipraPay secure payments", plan: "premium" },
      { name: "Campaign dashboard", plan: "premium" },
    ],
    premiumNote: "Paid advertising — daily rate × days × priority, from 1 day up.",
    accent: "cyan",
  },
  {
    id: "tamkin",
    kind: "ecosystem",
    name: "Tamkin Fund",
    nameBn: "তামকিন ফান্ড",
    tagline: "Qarz-e-Hasana & welfare, transparent by design",
    description:
      "A community fund powered by donations — interest-free Qarz-e-Hasana loans for entrepreneurs, business setup support, and welfare projects, with every transaction public.",
    longDescription:
      "Tamkin Fund is Qamarix's charitable arm: a transparent community fund built on donations (from ৳10) and 1% of Qamarix's own income. Money flows three ways — Qarz-e-Hasana (interest-free loans to entrepreneurs, whose repayments recycle back into the fund), direct business enablement (setting up shops, machines, and equipment), and welfare & empowerment projects. Every transaction is published publicly while recipients' identities stay private. Donations can be one-time, daily, monthly, or yearly; general donations only (not zakat) are accepted at the moment, and help applications reopen soon.",
    categories: ["Community", "Islamic"],
    freeType: "donation",
    platforms: ["web"],
    links: [{ label: "Support the Fund", url: "https://qamarix.com/tamkin", kind: "site" }],
    features: [
      { name: "Qarz-e-Hasana interest-free loans", plan: "free" },
      { name: "Business setup: shops, machines, tools", plan: "free" },
      { name: "Welfare & community empowerment", plan: "free" },
      { name: "Public, transparent transaction ledger", plan: "free" },
      { name: "1% of Qamarix income flows in", plan: "free" },
    ],
    premiumNote: "Donate from ৳10 — one-time, daily, monthly, or yearly (not zakat yet).",
    accent: "emerald",
  },
];

export const FREE_TOOLS = TOOLS.filter((t) => t.kind === "tool");
export const ECOSYSTEM = TOOLS.filter((t) => t.kind === "ecosystem");

export const TOTAL_DOWNLOADS = "51,000+";
