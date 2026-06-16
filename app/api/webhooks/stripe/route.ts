import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClientSync } from "@/lib/supabase/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { subscriptionWelcomeEmail, subscriptionCancelledEmail, paymentFailedEmail } from "@/lib/emails";

const PLAN_LIMITS: Record<string, number> = {
  seed: 10,
  grow: 50,
  scale: 200,
  enterprise: 999999,
};

// Map price IDs → plan names (monthly and annual both map to same plan)
function buildPlanMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const pairs = [
    ["STRIPE_SEED_PRICE_ID", "seed"],
    ["STRIPE_GROW_PRICE_ID", "grow"],
    ["STRIPE_SCALE_PRICE_ID", "scale"],
    ["STRIPE_SEED_ANNUAL_PRICE_ID", "seed"],
    ["STRIPE_GROW_ANNUAL_PRICE_ID", "grow"],
    ["STRIPE_SCALE_ANNUAL_PRICE_ID", "scale"],
  ] as const;
  for (const [envKey, plan] of pairs) {
    const id = process.env[envKey];
    if (id) map[id] = plan;
  }
  return map;
}

// Map price IDs → billing cycle
function buildCycleMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const monthly = ["STRIPE_SEED_PRICE_ID", "STRIPE_GROW_PRICE_ID", "STRIPE_SCALE_PRICE_ID"];
  const annual = ["STRIPE_SEED_ANNUAL_PRICE_ID", "STRIPE_GROW_ANNUAL_PRICE_ID", "STRIPE_SCALE_ANNUAL_PRICE_ID"];
  for (const k of monthly) { const v = process.env[k]; if (v) map[v] = "monthly"; }
  for (const k of annual) { const v = process.env[k]; if (v) map[v] = "annual"; }
  return map;
}

async function sendEmail(to: string, template: { subject: string; html: string; text?: string }) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care", to, ...template });
}

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
  const PLAN_MAP = buildPlanMap();
  const CYCLE_MAP = buildCycleMap();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organisation_id;
      const addonType = session.metadata?.addon_type;
      const plan = session.metadata?.plan;

      if (!orgId) break;

      // Handle add-on purchases
      if (addonType) {
        await handleAddonPurchase(supabase, session, orgId, addonType);
        break;
      }

      // Handle main plan subscription
      if (!plan) break;

      // Determine billing cycle from price ID
      let billingCycle = "monthly";
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        const priceId = sub.items.data[0]?.price.id;
        billingCycle = CYCLE_MAP[priceId] ?? "monthly";
      }

      await supabase.from("organisations").update({
        plan,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: String(session.subscription ?? ""),
        subscription_status: "active",
        subscription_tier: plan,
        max_staff: PLAN_LIMITS[plan] ?? 10,
        billing_cycle: billingCycle,
        trial_ends_at: null,
      }).eq("id", orgId);

      const { data: org } = await supabase.from("organisations").select("email, name").eq("id", orgId).single();
      if (org?.email) {
        const tpl = subscriptionWelcomeEmail(org.name, org.name, plan);
        await sendEmail(org.email, tpl);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan = PLAN_MAP[priceId] ?? "seed";
      const billingCycle = CYCLE_MAP[priceId] ?? "monthly";
      const statusMap: Record<string, string> = {
        active: "active", past_due: "active", unpaid: "suspended", canceled: "canceled",
      };

      await supabase.from("organisations").update({
        plan,
        subscription_tier: plan,
        subscription_status: statusMap[sub.status] ?? sub.status,
        max_staff: PLAN_LIMITS[plan] ?? 10,
        billing_cycle: billingCycle,
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { data: org } = await supabase.from("organisations")
        .select("email, name").eq("stripe_subscription_id", sub.id).single();

      await supabase.from("organisations").update({
        plan: "seed",
        subscription_tier: "seed",
        subscription_status: "canceled",
        max_staff: 10,
        stripe_subscription_id: null,
        billing_cycle: "monthly",
      }).eq("stripe_subscription_id", sub.id);

      if (org?.email) {
        const tpl = subscriptionCancelledEmail(org.name, org.name);
        await sendEmail(org.email, tpl);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
      if (invoice.subscription) {
        await supabase.from("organisations").update({
          subscription_status: "past_due",
        }).eq("stripe_subscription_id", String(invoice.subscription));

        const { data: org } = await supabase.from("organisations")
          .select("email, name").eq("stripe_subscription_id", String(invoice.subscription)).single();
        if (org?.email) {
          const tpl = paymentFailedEmail(org.name, "your plan");
          await sendEmail(org.email, tpl);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleAddonPurchase(
  supabase: ReturnType<typeof createServiceClientSync>,
  session: Stripe.Checkout.Session,
  orgId: string,
  addonType: string
) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@careroot.care";

  const { data: org } = await supabase.from("organisations").select("name, email").eq("id", orgId).single();

  // Create addon record
  await supabase.from("organisation_addons").insert({
    organisation_id: orgId,
    addon_type: addonType,
    status: "active",
    stripe_subscription_id: session.subscription ? String(session.subscription) : null,
    stripe_payment_intent_id: session.payment_intent ? String(session.payment_intent) : null,
  });

  // White label addons — enable white label on org
  if (["white_label_basic", "white_label_full", "white_label_enterprise"].includes(addonType)) {
    const tier = addonType.replace("white_label_", "") as "basic" | "full" | "enterprise";
    await supabase.from("organisations").update({
      white_label: true,
      wl_package_tier: tier,
      wl_stripe_extra_subscription_id: session.subscription ? String(session.subscription) : null,
    }).eq("id", orgId);

    // Notify customer
    if (resend && org?.email) {
      await resend.emails.send({
        from,
        to: org.email,
        subject: "Your white label package is active — Careroot",
        html: `<p>Hi ${org.name},</p><p>Your white label package is now active. Set up your branding at <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/white-label">Settings → White Label</a>.</p><p>The Careroot team</p>`,
      });
    }
    // Internal notification
    if (resend) {
      await resend.emails.send({
        from,
        to: "booking@careroot.care",
        subject: `New white label customer: ${org?.name ?? orgId}`,
        html: `<p>Organisation: ${org?.name}<br/>Tier: ${tier}<br/>Org ID: ${orgId}</p>`,
      });
    }
  }

  // Extra staff block — add 10 staff per quantity
  if (addonType === "extra_staff_block") {
    const qty = Number(session.metadata?.quantity ?? 1);
    const { data: current } = await supabase.from("organisations").select("max_staff").eq("id", orgId).single();
    await supabase.from("organisations").update({
      max_staff: (current?.max_staff ?? 10) + qty * 10,
    }).eq("id", orgId);
  }

  // API access — enable flag and generate key
  if (addonType === "api_access") {
    const apiKey = `cr_live_${crypto.randomUUID().replace(/-/g, "")}`;
    const { data: current } = await supabase.from("organisations").select("settings").eq("id", orgId).single();
    const settings = (current?.settings as Record<string, unknown>) ?? {};
    await supabase.from("organisations").update({
      settings: { ...settings, api_access_enabled: true, api_key: apiKey },
    }).eq("id", orgId);

    if (resend && org?.email) {
      await resend.emails.send({
        from,
        to: org.email,
        subject: "Your API key is ready — Careroot",
        html: `<p>Your API key: <strong>${apiKey}</strong></p><p>Keep this safe. Find it any time at Settings → Integrations.</p>`,
      });
    }
  }

  // One-time addons — send internal fulfilment notification
  if (["cqc_inspection_pack", "onboarding_support", "paper_migration"].includes(addonType)) {
    if (resend) {
      await resend.emails.send({
        from,
        to: "booking@careroot.care",
        subject: `New add-on purchase: ${addonType} — ${org?.name ?? orgId}`,
        html: `<p>Organisation: ${org?.name}<br/>Add-on: ${addonType}<br/>Email: ${org?.email}</p>`,
      });
    }
    if (resend && org?.email) {
      await resend.emails.send({
        from,
        to: org.email,
        subject: "Add-on purchase confirmed — Careroot",
        html: `<p>Thank you for purchasing ${addonType.replace(/_/g, " ")}. Our team will be in touch within 1 business day to get started.</p>`,
      });
    }
  }
}
