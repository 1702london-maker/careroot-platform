import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo | Careroot",
  description: "See Careroot in action. Book a personalised demo of the UK's most intelligent care management platform. Takes 30 minutes.",
  openGraph: { title: "Book a Demo | Careroot", description: "See the Careroot care management platform live — book your free demo.", url: "https://www.careroot.co.uk/demo", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
