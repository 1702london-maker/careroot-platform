import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GP Connect Integration | Careroot",
  description: "Careroot's GP Connect integration gives carers real-time access to GP appointment and medication data. Coming soon to UK care providers.",
  openGraph: { title: "GP Connect Integration | Careroot", url: "https://www.careroot.co.uk/gp-connect", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
