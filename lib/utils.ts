import { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDateUK(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeUK(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeUK(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatCurrencyGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount / 100);
}

export function generateComplaintReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CR-${year}-${random}`;
}

export function getDaysSince(date: string | Date): number {
  const now = new Date();
  const then = new Date(date);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}`;
}

export const PLAN_LIMITS: Record<string, number> = {
  seed: 10,
  grow: 50,
  scale: 200,
  enterprise: Infinity,
};

export function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    completed: "bg-cr-mint text-cr-forest",
    in_progress: "bg-amber-50 text-amber-700",
    missed: "bg-red-50 text-cr-red",
    scheduled: "bg-gray-100 text-cr-slate",
    cancelled: "bg-gray-100 text-cr-slate",
    active: "bg-cr-mint text-cr-forest",
    draft: "bg-gray-100 text-cr-slate",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-cr-mint text-cr-forest",
    overdue: "bg-red-50 text-cr-red",
    open: "bg-amber-50 text-amber-700",
    resolved: "bg-cr-mint text-cr-forest",
    high: "bg-red-50 text-cr-red",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-gray-100 text-cr-slate",
    critical: "bg-red-50 text-cr-red font-bold",
  };
  return classes[status.toLowerCase()] || "bg-gray-100 text-cr-slate";
}

export function getRiskDotClass(level: string): string {
  const classes: Record<string, string> = {
    low: "bg-cr-forest",
    medium: "bg-cr-amber",
    high: "bg-cr-red",
    critical: "bg-cr-red",
  };
  return classes[level.toLowerCase()] || "bg-cr-slate";
}
