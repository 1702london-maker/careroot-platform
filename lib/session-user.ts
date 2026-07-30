import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  organisation_id: string;
  role: string;
};

export async function requireSessionUser(allowedRoles?: string[]) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, error: Response.json({ error: "Unauthorised" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, organisation_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organisation_id || profile.is_active === false) {
    return { supabase, user: null, error: Response.json({ error: "User profile not active" }, { status: 403 }) };
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile.role)) {
    return { supabase, user: null, error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user: profile as SessionUser, error: null };
}

export function assertSameOrganisation(requestedOrgId: unknown, sessionOrgId: string) {
  return !requestedOrgId || requestedOrgId === sessionOrgId;
}
