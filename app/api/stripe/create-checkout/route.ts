import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLAN_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { plan, billing_cycle = "monthly", organisation_id } = await req.json();
    if (!plan || !organisation_id) {
      return NextResponse.json({ error: "plan and organisation_id required" }, { status: 400 });
    }

    const planPrices = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
    if (!planPrices) {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    const priceId = billing_cycle === "annual" ? planPrices.annual : planPrices.monthly;
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for ${plan}/${billing_cycle}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: org } = await supabase
      .from("organisations")
      .select("stripe_customer_id, email, name")
      .eq("id", organisation_id)
      .single();

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.co.uk";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: org?.stripe_customer_id ?? undefined,
      customer_email: org?.stripe_customer_id ? undefined : (org?.email ?? user.email),
      metadata: { organisation_id, plan, billing_cycle },
      success_url: `${appUrl}/dashboard/billing?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: { metadata: { organisation_id, plan, billing_cycle } },
      allow_promotion_codes: true,
      integration_identifier: "careroot-plan-checkout-abcd1234",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
