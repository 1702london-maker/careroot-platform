import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClientSync } from "@/lib/supabase/server";
import Stripe from "stripe";

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_SEED || ""]: "seed",
  [process.env.STRIPE_PRICE_GROW || ""]: "grow",
  [process.env.STRIPE_PRICE_SCALE || ""]: "scale",
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClientSync();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organisation_id;
      if (orgId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        const priceId = sub.items.data[0]?.price.id;
        const plan = PLAN_MAP[priceId] || "seed";

        await supabase.from("organisations").update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: String(session.subscription),
          subscription_status: "active",
          trial_ends_at: null,
        }).eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan = PLAN_MAP[priceId] || "seed";

      await supabase.from("organisations").update({
        plan,
        subscription_status: sub.status,
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("organisations").update({
        plan: "seed",
        subscription_status: "cancelled",
        stripe_subscription_id: null,
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
      if (invoice.subscription) {
        await supabase.from("organisations").update({
          subscription_status: "past_due",
        }).eq("stripe_subscription_id", String(invoice.subscription));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
