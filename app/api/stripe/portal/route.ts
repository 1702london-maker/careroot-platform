import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { organisation_id } = await req.json();
    if (!organisation_id) {
      return NextResponse.json({ error: "organisation_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: org } = await supabase.from("organisations").select("stripe_customer_id").eq("id", organisation_id).single();

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found — please upgrade first" }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care";

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("stripe portal error:", error);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}
