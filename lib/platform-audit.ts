import type { SupabaseClient } from "@supabase/supabase-js";

type AuditArgs = {
  organisationId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  req?: Request;
};

export async function writeAuditLog(supabase: SupabaseClient, args: AuditArgs) {
  const ip = args.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? args.req?.headers.get("x-real-ip")
    ?? null;

  const { error } = await supabase.from("platform_audit_logs").insert({
    organisation_id: args.organisationId ?? null,
    actor_user_id: args.actorUserId ?? null,
    actor_email: args.actorEmail ?? null,
    actor_role: args.actorRole ?? null,
    action: args.action,
    entity_type: args.entityType ?? null,
    entity_id: args.entityId ?? null,
    metadata: args.metadata ?? {},
    ip_address: ip,
    user_agent: args.req?.headers.get("user-agent") ?? null,
  });

  if (error) console.error("[audit] write failed:", error.message);
}

export async function writeCronRun(
  supabase: SupabaseClient,
  args: {
    jobName: string;
    path: string;
    status: "started" | "success" | "failed" | "unauthorised";
    startedAt?: Date;
    result?: Record<string, unknown>;
    error?: string;
  }
) {
  const finishedAt = args.status === "started" ? null : new Date();
  const durationMs = args.startedAt && finishedAt
    ? Math.max(0, finishedAt.getTime() - args.startedAt.getTime())
    : null;

  const { error } = await supabase.from("cron_run_logs").insert({
    job_name: args.jobName,
    path: args.path,
    status: args.status,
    started_at: args.startedAt?.toISOString() ?? new Date().toISOString(),
    finished_at: finishedAt?.toISOString() ?? null,
    duration_ms: durationMs,
    result: args.result ?? {},
    error: args.error ?? null,
  });

  if (error) console.error("[cron-audit] write failed:", error.message);
}
