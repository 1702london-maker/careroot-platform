import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FamilyPortalClient } from "@/components/family/FamilyPortalClient";

interface Props { params: Promise<{ clientId: string }> }

export default async function FamilyClientPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/family/login");

  const { data: access } = await supabase
    .from("family_access")
    .select("*, clients(*)")
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  if (!access) notFound();

  const client = access.clients as Record<string, unknown>;
  const accessLevel = String(access.access_level);

  const [
    { data: recentVisits },
    { data: complaints },
    { data: briefings },
    { data: familyUser },
  ] = await Promise.all([
    supabase.from("visits")
      .select("id, scheduled_start, scheduled_end, actual_start, actual_end, status, notes, users(first_name, last_name)")
      .eq("client_id", clientId)
      .order("scheduled_start", { ascending: false })
      .limit(20),
    accessLevel !== "limited"
      ? supabase.from("complaints")
          .select("id, description, status, complaint_type, created_at, priority")
          .eq("client_id", clientId)
          .eq("complainant_email", user.email)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("family_briefings")
      .select("id, content, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("users").select("first_name, last_name, email, phone").eq("id", user.id).single(),
  ]);

  return (
    <FamilyPortalClient
      client={client}
      accessLevel={accessLevel}
      accessId={access.id}
      familyUser={familyUser}
      recentVisits={recentVisits ?? []}
      complaints={complaints ?? []}
      briefings={briefings ?? []}
    />
  );
}
