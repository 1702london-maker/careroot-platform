import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Sign In | Careroot",
  description: "Sign in to your Careroot care management dashboard.",
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
