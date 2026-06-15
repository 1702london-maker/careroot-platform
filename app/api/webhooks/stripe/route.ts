import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClientSync } from "@/lib/supabase/server";
import Stripe from "stripe";
import { Resend } from "resend";

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_SEED_PRICE_ID ?? "__seed"]: "seed",
  [process.env.STRIPE_GROW_PRICE_ID ?? "__grow"]: "grow",
  [process.env.STRIPE_SCALE_PRICE_ID ?? "__scale"]: "scale",
};

const MAX_STAFF: Record<string, number> = { seed: 10, grow: 50, scale: 200 };

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClientSync();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organisation_id;
      const plan = session.metadata?.plan ?? "seed";
      if (!orgId) break;

      await supabase.from("organisations").update({
        plan,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: String(session.subscription ?? ""),
        subscription_status: "active",
        subscription_tier: plan,
        max_staff: MAX_STAFF[plan] ?? 10,
        trial_ends_at: null,
      }).eq("id", orgId);

      // Welcome email
      if (process.env.RESEND_API_KEY) {
        const { data: org } = await supabase.from("organisations").select("email, name").eq("id", orgId).single();
        if (org?.email) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care",
            to: org.email,
            subject: "Welcome to Careroot — your subscription is active",
            html: `<div style="font-family:sans-serif;max-width:600px">
              <div style="background:#1A3C2E;padding:24px;border-radius:8px 8px 0 0">
                <h2 style="color:white;margin:0">Careroot</h2>
              </div>
              <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                <p>Hi ${org.name},</p>
                <p>Your <strong>${plan}</strong> subscription is now active. You're all set.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care"}/dashboard" style="background:#1A3C2E;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Go to dashboard →</a></p>
              </div>
            </div>`,
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan = PLAN_MAP[priceId] ?? "seed";
      const statusMap: Record<string, string> = { active: "active", past_due: "active", unpaid: "suspended", canceled: "canceled" };

      await supabase.from("organisations").update({
        plan,
        subscription_tier: plan,
        subscription_status: statusMap[sub.status] ?? sub.status,
        max_staff: MAX_STAFF[plan] ?? 10,
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("organisations").update({
        plan: "seed",
        subscription_tier: "starter",
        subscription_status: "canceled",
        max_staff: 10,
        stripe_subscription_id: null,
      }).eq("stripe_subscription_id", sub.id);

      if (process.env.RESEND_API_KEY) {
        const { data: org } = await supabase.from("organisations").select("email, name").eq("stripe_subscription_id", sub.id).single();
        if (org?.email) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care",
            to: org.email,
            subject: "Your Careroot subscription has been cancelled",
            html: `<p>Hi ${org.name}, your Careroot subscription has been cancelled. You have been moved to the free Seed plan (up to 10 staff). To reactivate, visit <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://careroot.care"}/pricing">careroot.care/pricing</a>.</p>`,
          });
        }
      }
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
