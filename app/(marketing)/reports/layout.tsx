import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CQC Compliance Reports | Careroot",
  description: "Real-time CQC compliance, incident, financial, and staffing reports for UK care providers. Evidence-ready for inspections.",
  openGraph: { title: "CQC Compliance Reports | Careroot", url: "https://www.careroot.co.uk/reports", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
