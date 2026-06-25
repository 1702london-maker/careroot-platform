import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Careroot",
  description: "Reset your Careroot account password.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
