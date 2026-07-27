import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Client Login | Careroot",
  description: "Sign in to view your care visits, medication records, and rights.",
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
