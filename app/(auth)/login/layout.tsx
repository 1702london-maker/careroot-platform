import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Careroot",
  description: "Sign in to your Careroot care management dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
