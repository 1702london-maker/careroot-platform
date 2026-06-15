import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia" as const,
});

export const PLAN_PRICES = {
  seed: process.env.STRIPE_PRICE_SEED,
  grow: process.env.STRIPE_PRICE_GROW,
  scale: process.env.STRIPE_PRICE_SCALE,
};
