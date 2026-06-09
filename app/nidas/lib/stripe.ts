import Stripe from "stripe";

// Server-only Stripe client. Returns null when no key is configured yet,
// so the storefront still renders and checkout fails gracefully.
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;
