import ChatWidget from "@/components/marketing/ChatWidget";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
