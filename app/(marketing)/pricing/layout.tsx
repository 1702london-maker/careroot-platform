import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Careroot",
  description: "Simple, transparent pricing for UK care providers. Starter, Professional, and Enterprise plans. Start free for 30 days — no credit card required.",
  openGraph: { title: "Pricing | Careroot", description: "Affordable care management software pricing for UK providers.", url: "https://www.careroot.co.uk/pricing", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
