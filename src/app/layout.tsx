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
  title: "zyric.tech — 55 Free Online Tools for Everything",
  description:
    "55 free browser tools, including 8 signature tools you won't find elsewhere: file submission checker, spreadsheet health inspector, document diff, website launch checker, expiry calendar, handover pack builder, privacy scrubber and file inspector — plus notes, trackers, calculators, converters, image & color tools, invoices and more. No sign-up, everything runs on your device.",
  keywords: [
    "free online tools",
    "web tools",
    "file submission checker",
    "spreadsheet health inspector",
    "document diff",
    "website audit tool",
    "expiry calendar reminder",
    "notes app",
    "expense tracker",
    "habit tracker",
    "calculators",
    "unit converter",
    "image compressor",
    "color palette generator",
    "invoice generator",
    "password generator",
    "QR code generator",
    "zyric",
  ],
  openGraph: {
    title: "zyric.tech — 55 Free Online Tools for Everything",
    description:
      "55 free tools in one place — including 8 signature tools exclusive to Zyric. Runs locally, no sign-up.",
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
