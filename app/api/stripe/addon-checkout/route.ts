import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const ADDON_PRICE_MAP: Record<string, { envKey: string; mode: "payment" | "subscription" }> = {
  cqc_inspection_pack: { envKey: "STRIPE_ADDON_CQC_PACK_PRICE_ID", mode: "payment" },
  onboarding_support: { envKey: "STRIPE_ADDON_ONBOARDING_PRICE_ID", mode: "payment" },
  paper_migration: { envKey: "STRIPE_ADDON_PAPER_MIGRATION_PRICE_ID", mode: "payment" },
  extra_staff_block: { envKey: "STRIPE_ADDON_EXTRA_STAFF_PRICE_ID", mode: "subscription" },
  api_access: { envKey: "STRIPE_ADDON_API_ACCESS_PRICE_ID", mode: "subscription" },
  white_label_basic: { envKey: "STRIPE_ADDON_WL_BASIC_PRICE_ID", mode: "subscription" },
  white_label_full: { envKey: "STRIPE_ADDON_WL_FULL_PRICE_ID", mode: "subscription" },
  white_label_enterprise: { envKey: "STRIPE_ADDON_WL_ENTERPRISE_PRICE_ID", mode: "subscription" },
};

const WL_SETUP_PRICE_MAP: Record<string, string> = {
  white_label_basic: "STRIPE_ADDON_WL_BASIC_SETUP_PRICE_ID",
  white_label_full: "STRIPE_ADDON_WL_FULL_SETUP_PRICE_ID",
  white_label_enterprise: "STRIPE_ADDON_WL_ENTERPRISE_SETUP_PRICE_ID",
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { addon_type, quantity = 1 } = await req.json();
  if (!addon_type || !ADDON_PRICE_MAP[addon_type]) {
    return NextResponse.json({ error: "Invalid addon_type" }, { status: 400 });
  }

  const { data: userRecord } = await supabase
    .from("users").select("organisation_id, organisations(stripe_customer_id, name)").eq("id", user.id).single();
  if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const orgId = userRecord.organisation_id;
  const org = userRecord.organisations as Record<string, string> | null;
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

  const addonConfig = ADDON_PRICE_MAP[addon_type];
  const priceId = process.env[addonConfig.envKey];
  if (!priceId) {
    return NextResponse.json({ error: `Price not configured for ${addon_type}` }, { status: 503 });
  }

  const isWhiteLabel = addon_type.startsWith("white_label_");
  const setupPriceEnvKey = WL_SETUP_PRICE_MAP[addon_type];
  const setupPriceId = setupPriceEnvKey ? process.env[setupPriceEnvKey] : null;

  const lineItems: Array<{ price: string; quantity: number }> = [
    { price: priceId, quantity: addon_type === "extra_staff_block" ? quantity : 1 },
  ];

  // White label includes a one-time setup fee as second line item
  if (isWhiteLabel && setupPriceId) {
    lineItems.push({ price: setupPriceId, quantity: 1 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: addonConfig.mode,
    line_items: lineItems,
    customer: org?.stripe_customer_id || undefined,
    metadata: {
      organisation_id: orgId,
      addon_type,
      quantity: String(quantity),
    },
    success_url: `${appUrl}/settings/billing?addon_success=1`,
    cancel_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
