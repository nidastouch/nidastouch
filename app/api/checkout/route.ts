import { NextResponse } from "next/server";
import { stripe } from "../../nidas/lib/stripe";
import { getProduct } from "../../nidas/lib/catalog";

export const runtime = "nodejs";

interface IncomingItem { slug: string; size: string; qty: number }

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Checkout is not configured yet. Add your Stripe keys to enable payments." },
      { status: 503 }
    );
  }

  let body: { items?: IncomingItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  // Rebuild line items from the server-side catalog so prices can't be tampered with.
  const line_items: {
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; metadata: Record<string, string> };
    };
  }[] = [];

  for (const it of items) {
    const product = getProduct(String(it.slug));
    if (!product || !product.available) continue;
    if (!product.sizes.includes(String(it.size))) continue;
    const qty = Math.max(1, Math.min(10, Number(it.qty) || 1));
    line_items.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: `${product.name} / ${it.size}`,
          metadata: { slug: product.slug, size: String(it.size) },
        },
      },
    });
  }

  if (line_items.length === 0) {
    return NextResponse.json({ error: "No purchasable items in your bag." }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/nidas/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/nidas`,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === "true" },
      ...(process.env.STRIPE_SHIPPING_RATE
        ? { shipping_options: [{ shipping_rate: process.env.STRIPE_SHIPPING_RATE }] }
        : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
