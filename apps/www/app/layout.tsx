import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Saascription | SaaS subscription management",
    template: "%s | Saascription",
  },
  description:
    "Track company subscriptions, renewals, and spend in one place. Built for finance and IT teams who need clarity, not another spreadsheet.",
  openGraph: {
    type: "website",
    siteName: "Saascription",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        geistSans.className,
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
