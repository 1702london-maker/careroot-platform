import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const PRICE_MAP: Record<string, string | undefined> = {
  seed: process.env.STRIPE_SEED_PRICE_ID,
  grow: process.env.STRIPE_GROW_PRICE_ID,
  scale: process.env.STRIPE_SCALE_PRICE_ID,
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { plan, organisation_id } = await req.json();
    if (!plan || !organisation_id) {
      return NextResponse.json({ error: "plan and organisation_id required" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for plan: ${plan}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: org } = await supabase.from("organisations").select("stripe_customer_id, email, name").eq("id", organisation_id).single();

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: org?.stripe_customer_id ?? undefined,
      customer_email: org?.stripe_customer_id ? undefined : (org?.email ?? user.email),
      metadata: { organisation_id, plan },
      success_url: `${appUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: {
        metadata: { organisation_id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
