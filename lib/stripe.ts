import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

// Standardised price ID env vars — used across all routes
export const PLAN_PRICES = {
  seed:  { monthly: process.env.STRIPE_SEED_PRICE_ID,  annual: process.env.STRIPE_SEED_ANNUAL_PRICE_ID  },
  grow:  { monthly: process.env.STRIPE_GROW_PRICE_ID,  annual: process.env.STRIPE_GROW_ANNUAL_PRICE_ID  },
  scale: { monthly: process.env.STRIPE_SCALE_PRICE_ID, annual: process.env.STRIPE_SCALE_ANNUAL_PRICE_ID },
};

export const PLAN_LIMITS: Record<string, number> = {
  seed: 10,
  grow: 50,
  scale: 200,
  enterprise: 999999,
};

export const PLAN_DISPLAY: Record<string, { name: string; monthlyPrice: number; annualPrice: number }> = {
  seed:  { name: "Seed",  monthlyPrice: 99,  annualPrice: 79  },
  grow:  { name: "Grow",  monthlyPrice: 349, annualPrice: 279 },
  scale: { name: "Scale", monthlyPrice: 899, annualPrice: 719 },
};
