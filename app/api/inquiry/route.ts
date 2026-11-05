import { NextResponse } from "next/server";

export const runtime = "nodejs";

/*
  The say hi form. It forwards each inquiry to INQUIRY_WEBHOOK_URL (a Formspree form, a Zapier or Make
  hook that emails Leo, a Google Sheet, anything that takes a JSON POST). Until that's set, it answers
  503 with fallback: "mailto", and the form opens the sender's email app with everything filled in, so
  nothing is ever lost.
*/

const KINDS = ["brand or product film", "short form", "series", "photos", "something else"];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // a field people never see: anything that fills it in is a bot
  if (String(body.company || "").trim()) return NextResponse.json({ ok: true });

  const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const inquiry = {
    name: clip(body.name, 120),
    email: clip(body.email, 200),
    kind: KINDS.includes(String(body.kind)) ? String(body.kind) : "something else",
    message: clip(body.message, 4000),
    at: new Date().toISOString(),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  if (inquiry.message.length < 2) {
    return NextResponse.json({ error: "Tell us a little about it first." }, { status: 400 });
  }

  const hook = process.env.INQUIRY_WEBHOOK_URL;
  if (!hook) {
    console.log("[nidas touch inquiry, no webhook set]", inquiry);
    return NextResponse.json({ error: "Not connected yet.", fallback: "mailto" }, { status: 503 });
  }

  try {
    const r = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(inquiry),
      signal: AbortSignal.timeout(8000), // a hung webhook shouldn't leave the sender waiting: it falls back to email
    });
    if (!r.ok) throw new Error(`webhook ${r.status}`);
  } catch (e) {
    console.error("[nidas touch inquiry, webhook failed]", e, inquiry);
    return NextResponse.json({ error: "Couldn't send it.", fallback: "mailto" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
