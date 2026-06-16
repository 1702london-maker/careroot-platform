import { WhiteLabelProvider } from "@/components/providers/WhiteLabelProvider";

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return <WhiteLabelProvider>{children}</WhiteLabelProvider>;
}
