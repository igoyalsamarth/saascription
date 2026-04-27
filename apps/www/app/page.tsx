import type { Metadata } from "next";

import { HomeLandingSections } from "@/components/landing/home-sections";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: { absolute: "Saascription | SaaS subscription management" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Saascription | SaaS subscription management",
    description:
      "Manage all your SaaS subscriptions with AI. Discover, track, and optimize your software stack in one place.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      <main>
        <HomeLandingSections />
      </main>
      <SiteFooter />
    </div>
  );
}
