import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Free Trial | Careroot",
  description: "Create your Careroot account. 30 days free — no credit card required. UK care management software for CQC compliance.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
