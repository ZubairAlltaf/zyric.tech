import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Zyric Tools Hub — Every Free Tool from zyric.tech",
  description:
    "A complete directory of free tools in the zyric.tech / Qamarix ecosystem: AyBay income & expense tracker, Hishab business accounting, Quran Words, community platform, video tutorials, and the monthly leaderboard.",
  keywords: [
    "zyric.tech",
    "Qamarix",
    "free tools",
    "AyBay",
    "আয় ব্যয়",
    "Hishab",
    "হিসাব",
    "Quran Words",
    "কুরআন ওয়ার্ডস",
    "Bangladesh apps",
    "free finance app",
  ],
  openGraph: {
    title: "Zyric Tools Hub — Every Free Tool from zyric.tech",
    description:
      "All free tools from the Qamarix ecosystem, in one place: apps, features, prices, and links.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
