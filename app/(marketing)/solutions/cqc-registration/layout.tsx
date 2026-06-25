import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CQC Registration Support | Careroot",
  description: "Launch your care agency with CQC-ready documentation, policies, care plan templates, and compliance tracking built into Careroot from day one.",
  openGraph: { title: "CQC Registration Support | Careroot", url: "https://www.careroot.co.uk/solutions/cqc-registration", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
