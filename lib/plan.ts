/**
 * Plan entitlements — single source of truth for what each subscription tier
 * unlocks. Used to gate premium features server-side (not just hide UI).
 */

export type Plan = "seed" | "grow" | "scale" | "enterprise";

export const STAFF_LIMIT: Record<Plan, number> = {
  seed: 10,
  grow: 50,
  scale: 200,
  enterprise: Infinity,
};

export function normalisePlan(plan?: string | null): Plan {
  return (["seed", "grow", "scale", "enterprise"].includes(plan ?? "") ? plan : "seed") as Plan;
}

type OrgLike = {
  plan?: string | null;
  white_label?: boolean | null;
  subscription_status?: string | null;
};

/**
 * White-label branding requires either the paid white-label add-on flag or an
 * Enterprise plan. (Add-on is sold separately from the base tier.)
 */
export function canUseWhiteLabel(org: OrgLike): boolean {
  return Boolean(org.white_label) || normalisePlan(org.plan) === "enterprise";
}

/** The public API add-on / API access is Scale-and-up (or explicit add-on). */
export function canUseApiAccess(org: OrgLike): boolean {
  const p = normalisePlan(org.plan);
  return p === "scale" || p === "enterprise";
}

/** Staff headcount ceiling for the org's plan. */
export function staffLimit(org: OrgLike): number {
  return STAFF_LIMIT[normalisePlan(org.plan)];
}

/**
 * A subscription is considered active for entitlement purposes when trialing or
 * active. Past-due/canceled orgs keep base access but lose premium add-ons.
 */
export function subscriptionActive(org: OrgLike): boolean {
  return ["trial", "trialing", "active"].includes(org.subscription_status ?? "trial");
}
