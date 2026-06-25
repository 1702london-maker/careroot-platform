import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Software for New Care Agencies | Careroot",
  description: "Starting a new care agency? Careroot gives you everything from day one: CQC-ready care plans, staff management, compliance tracking, and a carer app.",
  openGraph: { title: "Software for New Care Agencies | Careroot", url: "https://www.careroot.co.uk/solutions/new-agencies", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
