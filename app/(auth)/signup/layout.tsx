import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Start Free Trial | Careroot",
  description: "Create your Careroot account. 30 days free — no credit card required. UK care management software for CQC compliance.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-[#F9F7F4]">{children}</main>
      <MarketingFooter />
    </>
  );
}
