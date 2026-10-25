import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "zyric.tech — 23 Free Online Tools for Everything",
  description:
    "Free online tools in every niche: quick notes, expense & habit trackers, to-do lists, calculators (BMI, loan, percentage, age), unit & currency converters, pomodoro timer, stopwatch, password generator, QR codes, JSON tools and more — all in your browser, no sign-up.",
  keywords: [
    "free online tools",
    "web tools",
    "notes app",
    "expense tracker",
    "habit tracker",
    "todo list",
    "calculators",
    "unit converter",
    "currency converter",
    "pomodoro timer",
    "password generator",
    "QR code generator",
    "JSON formatter",
    "zyric",
  ],
  openGraph: {
    title: "zyric.tech — Free Online Tools for Everything",
    description:
      "22 free tools in one place: notes, trackers, calculators, converters, generators. Runs locally, no sign-up.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
