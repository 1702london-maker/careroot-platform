import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CRPageHeader } from "@/components/ui/CRPageHeader";
import { CRCard } from "@/components/ui/CRCard";
import { CRBadge } from "@/components/ui/CRBadge";
import { CREmptyState } from "@/components/ui/CREmptyState";
import { MessageSquare } from "lucide-react";
import { formatDateUK, getDaysSince } from "@/lib/utils";
import Link from "next/link";
import { ComplaintsHeader } from "@/components/complaints/ComplaintsHeader";

export default async function ComplaintsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRecord } = await supabase
    .from("users")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  // Carers cannot access complaints
  if (userRecord?.role === "carer") redirect("/dashboard");

  const [{ data: complaints }, { data: clients }] = await Promise.all([
    supabase
      .from("complaints")
      .select("*, clients(first_name, last_name)")
      .eq("organisation_id", userRecord?.organisation_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, first_name, last_name")
      .eq("organisation_id", userRecord?.organisation_id)
      .eq("is_active", true)
      .order("last_name"),
  ]);

  const getUrgencyVariant = (days: number, status: string) => {
    if (status === "resolved" || status === "closed") return "green";
    if (days >= 28) return "red";
    if (days >= 14) return "amber";
    return "slate";
  };

  return (
    <div>
      <ComplaintsHeader clients={clients ?? []} />

      {complaints?.length === 0 ? (
        <CREmptyState
          icon={<MessageSquare size={48} />}
          title="No complaints recorded"
          description="All submitted complaints will appear here."
        />
      ) : (
        <CRCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Reference", "Category", "Client", "Submitted", "Days open", "Status"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-body font-medium text-cr-slate uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints?.map((c) => {
                  const client = c.clients as Record<string, string> | null;
                  const days = getDaysSince(c.created_at);
                  const urgencyVariant = getUrgencyVariant(days, c.status);
                  const isOverdue = c.status !== "resolved" && c.status !== "closed" && days >= 28;
                  const isNearDeadline = c.status !== "resolved" && c.status !== "closed" && days >= 21;

                  return (
                    <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${isOverdue ? "bg-red-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-body font-semibold text-cr-forest">
                          {c.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-body text-cr-charcoal capitalize">
                          {c.category?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.is_anonymous ? (
                          <span className="text-xs font-body text-cr-slate italic">Anonymous</span>
                        ) : client ? (
                          <Link href={`/clients/${c.client_id}`} className="text-sm font-body text-cr-charcoal hover:text-cr-forest transition-colors">
                            {client.first_name} {client.last_name}
                          </Link>
                        ) : (
                          <span className="text-xs font-body text-cr-slate">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-body text-cr-slate">{formatDateUK(c.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <CRBadge variant={urgencyVariant as "green" | "red" | "amber" | "slate"} size="sm">
                          {days}d {isNearDeadline && "⚠️"}
                        </CRBadge>
                      </td>
                      <td className="px-6 py-4">
                        <CRBadge
                          variant={
                            c.status === "resolved" ? "green"
                              : c.status === "escalated" ? "red"
                              : c.status === "investigating" ? "amber"
                              : "slate"
                          }
                          size="sm"
                        >
                          {c.status}
                        </CRBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CRCard>
      )}
    </div>
  );
}
