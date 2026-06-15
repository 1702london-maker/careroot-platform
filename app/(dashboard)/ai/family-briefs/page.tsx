import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CRAIBadge } from "@/components/ui/CRAIBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { Mail } from "lucide-react";
import Link from "next/link";

export default async function FamilyBriefsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id").eq("id", user.id).single();
  const orgId = userRecord?.organisation_id;

  const { data: briefs } = await supabase
    .from("family_briefings")
    .select("*, clients(id, first_name, last_name)")
    .eq("organisation_id", orgId)
    .order("sent_at", { ascending: false });

  return (
    <div>
      <CRPageHeader
        title="Family Briefings"
        subtitle="AI-generated family update messages sent to clients' families"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AI", href: "/ai/insights" },
        ]}
      />

      {!briefs || briefs.length === 0 ? (
        <CREmptyState
          icon={<Mail className="text-cr-slate" size={40} />}
          title="No family briefings sent yet"
          description="Family briefings are generated and sent from the client profile page"
        />
      ) : (
        <div className="space-y-3">
          {briefs.map((brief) => {
            const client = brief.clients as Record<string, string> | null;
            const sentAt = brief.sent_at
              ? new Date(String(brief.sent_at)).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "Unknown";
            const preview = String(brief.content || "").slice(0, 160);
            return (
              <CRCard key={String(brief.id)} hover>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cr-mint rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-cr-forest" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {client ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-body font-semibold text-cr-charcoal hover:text-cr-forest transition-colors"
                        >
                          {client.first_name} {client.last_name}
                        </Link>
                      ) : (
                        <span className="font-body font-semibold text-cr-charcoal">Unknown client</span>
                      )}
                      {brief.ai_generated && <CRAIBadge />}
                      <CRBadge variant="slate" size="sm">Sent</CRBadge>
                    </div>
                    <p className="text-xs text-cr-slate mb-2">
                      Sent {sentAt}
                      {brief.sent_to && ` · To: ${brief.sent_to}`}
                    </p>
                    <p className="text-sm font-body text-cr-slate leading-relaxed line-clamp-2">
                      {preview}{String(brief.content || "").length > 160 ? "…" : ""}
                    </p>
                  </div>
                </div>
              </CRCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
