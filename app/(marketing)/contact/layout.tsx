import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Careroot",
  description: "Get in touch with the Careroot team. Questions about pricing, onboarding, or CQC compliance? We're here to help.",
  openGraph: { title: "Contact Us | Careroot", url: "https://www.careroot.co.uk/contact", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
