import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FamilyPortalView } from "@/components/family/FamilyPortalView";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function FamilyClientPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/family/login");

  // Verify family access
  const { data: access } = await supabase
    .from("family_access")
    .select("*, clients(*)")
    .eq("user_id", user.id)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .single();

  if (!access) notFound();

  const client = access.clients as Record<string, unknown>;
  const accessLevel = String(access.access_level); // basic, standard, full

  // Fetch data based on access level
  const [
    { data: recentVisits },
    { data: latestBriefing },
    { data: familyVisibleNotes },
    { data: incidents },
  ] = await Promise.all([
    supabase.from("visits")
      .select("scheduled_start, scheduled_end, status, users(first_name, last_name)")
      .eq("client_id", clientId)
      .order("scheduled_start", { ascending: false })
      .limit(10),
    supabase.from("family_briefings")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    accessLevel !== "basic"
      ? supabase.from("visit_notes")
          .select("content, sentiment, created_at, visits(users(first_name, last_name))")
          .eq("client_id", clientId)
          .eq("is_family_visible", true)
          .eq("is_internal", false)
          .order("created_at", { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
    accessLevel === "full"
      ? supabase.from("incidents")
          .select("*")
          .eq("client_id", clientId)
          .eq("is_family_visible", true)
          .order("reported_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <FamilyPortalView
      client={client}
      accessLevel={accessLevel}
      recentVisits={recentVisits || []}
      latestBriefing={latestBriefing}
      notes={familyVisibleNotes || []}
      incidents={incidents || []}
    />
  );
}
