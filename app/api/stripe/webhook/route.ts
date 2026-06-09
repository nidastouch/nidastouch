import Stripe from "stripe";
import { stripe } from "../../../nidas/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) return new Response("Stripe not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } else {
      // No signing secret set yet, parse without verification (dev only).
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bad signature";
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO fulfillment: send confirmation, record order, decrement inventory.
      console.log("[nidas order paid]", {
        id: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
      });
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
