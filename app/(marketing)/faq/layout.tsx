import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Careroot",
  description: "Answers to the most common questions about Careroot — setup, pricing, CQC compliance, data security, and migrating from paper records.",
  openGraph: { title: "FAQ | Careroot", url: "https://www.careroot.co.uk/faq", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
