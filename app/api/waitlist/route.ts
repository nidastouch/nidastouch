import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; product?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "").trim();
  const product = String(body.product || "general");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  // Always record server-side. Wire a destination below when ready
  // (Resend, Mailchimp, a Google Sheet via webhook, etc.).
  console.log("[nidas waitlist]", { email, product, at: new Date().toISOString() });

  // Optional: forward to a no-code webhook (Zapier / Make / Sheets) if configured.
  if (process.env.WAITLIST_WEBHOOK_URL) {
    try {
      await fetch(process.env.WAITLIST_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product, at: new Date().toISOString() }),
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ ok: true });
}
