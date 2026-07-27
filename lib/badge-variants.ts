export type BadgeVariant =
  | "green"
  | "amber"
  | "red"
  | "slate"
  | "gold"
  | "blue"
  | "forest";

export function riskVariant(level?: string): BadgeVariant {
  if (level === "critical") return "red";
  if (level === "high") return "red";
  if (level === "medium") return "amber";
  return "green";
}

export function statusVariant(status?: string): BadgeVariant {
  if (status === "active" || status === "completed" || status === "compliant") return "green";
  if (status === "inactive" || status === "cancelled" || status === "archived") return "slate";
  if (status === "hospital" || status === "review" || status === "partial") return "amber";
  if (status === "deceased" || status === "missed" || status === "non_compliant") return "red";
  if (status === "draft") return "amber";
  if (status === "in_progress") return "blue";
  return "slate";
}
