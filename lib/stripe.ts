import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as const,
    });
  }
  return _stripe;
}

export const PLAN_PRICES = {
  seed: process.env.STRIPE_PRICE_SEED,
  grow: process.env.STRIPE_PRICE_GROW,
  scale: process.env.STRIPE_PRICE_SCALE,
};
