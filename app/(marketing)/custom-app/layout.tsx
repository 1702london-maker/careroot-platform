import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Carer App | Careroot",
  description: "Launch a custom-branded mobile app for your care staff. Offline-first, GPS visit verification, medication prompts, and emergency response — under your brand.",
  openGraph: { title: "Custom Carer App | Careroot", url: "https://www.careroot.co.uk/custom-app", siteName: "Careroot" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
