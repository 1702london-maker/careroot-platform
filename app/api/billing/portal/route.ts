import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userRecord } = await supabase
      .from("users")
      .select("organisation_id, organisations(stripe_customer_id)")
      .eq("id", user.id)
      .single();

    const org = userRecord?.organisations as unknown as { stripe_customer_id?: string } | null;
    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found. Subscribe to a plan first." }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.co.uk";

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("billing portal error:", error);
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 });
  }
}
