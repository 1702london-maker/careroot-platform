import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Careroot — Care Management Platform",
  description: "The complete platform for UK care providers — from care plans to CQC compliance, all in one place.",
  keywords: ["care management", "CQC compliance", "domiciliary care", "care planning", "UK care software"],
  manifest: "/manifest.json",
  themeColor: "#1A3C2E",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Careroot" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="antialiased font-body bg-cr-ivory text-cr-charcoal">
        {children}
      </body>
    </html>
  );
}
