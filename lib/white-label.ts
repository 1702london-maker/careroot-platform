export interface WhiteLabelConfig {
  isWhiteLabel: boolean;
  appName: string;
  logoUrl: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  domain: string | null;
  emailFrom: string | null;
  supportEmail: string | null;
  packageTier: "basic" | "full" | "enterprise" | null;
}

export const defaultConfig: WhiteLabelConfig = {
  isWhiteLabel: false,
  appName: "Careroot",
  logoUrl: null,
  primaryColour: "#1A3C2E",
  secondaryColour: "#4A7C5E",
  accentColour: "#C9A84C",
  domain: "careroot.care",
  emailFrom: "noreply@careroot.care",
  supportEmail: "support@careroot.care",
  packageTier: null,
};

export function buildWhiteLabelConfig(org: Record<string, unknown>): WhiteLabelConfig {
  if (!org.white_label) return defaultConfig;
  return {
    isWhiteLabel: true,
    appName: (org.wl_app_name as string) || "Careroot",
    logoUrl: (org.wl_logo_url as string) || null,
    primaryColour: (org.wl_primary_colour as string) || "#1A3C2E",
    secondaryColour: (org.wl_secondary_colour as string) || "#4A7C5E",
    accentColour: (org.wl_accent_colour as string) || "#C9A84C",
    domain: (org.wl_domain as string) || null,
    emailFrom: (org.wl_email_from as string) || null,
    supportEmail: (org.wl_support_email as string) || null,
    packageTier: (org.wl_package_tier as WhiteLabelConfig["packageTier"]) || null,
  };
}
