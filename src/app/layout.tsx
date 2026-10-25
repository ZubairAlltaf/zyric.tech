import type { Metadata } from "next";
import {
  Archivo_Black,
  Geist,
  Geist_Mono,
  Space_Grotesk,
} from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-brut",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "zyric.tech — 75 Free Online Tools. Zero Servers.",
  description:
    "A junk drawer of 75 free browser tools, including 9 signature tools you won't find elsewhere: file submission checker, batch file renamer, spreadsheet health inspector, document diff, website launch checker, expiry calendar, handover pack builder and privacy scrubber — plus CSS generators, notes, trackers, calculators, converters, image & color tools, invoices and more. No uploads, no sign-ups, everything runs on your device.",
  keywords: [
    "free online tools",
    "web tools",
    "file submission checker",
    "batch file renamer",
    "spreadsheet health inspector",
    "document diff",
    "website audit tool",
    "expiry calendar reminder",
    "box shadow generator",
    "fancy border radius",
    "glassmorphism generator",
    "cubic bezier generator",
    "cron expression explainer",
    "subnet calculator",
    "utm link builder",
    "notes app",
    "expense tracker",
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
    title: "zyric.tech — 75 Free Online Tools. Zero Servers.",
    description:
      "75 free tools in one place — including 9 signature tools exclusive to Zyric. Runs locally, no sign-up.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${archivoBlack.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
