# Nidas Store — Setup Guide

Everything you need to turn the storefront into a fully functional shop that
takes real payments. The store lives at `/nidas` inside this same project.

The storefront, cart, sizes, product pages, waitlist, and order success flow
are already built and working. The only thing standing between you and live
sales is connecting Stripe (about 15 minutes).

---

## 1. Environment variables

Create a file named `.env.local` in the project root (copy `.env.example`).
Fill in the values from the steps below. Restart the dev server after editing.

| Variable | What it is | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Yes (for payments) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for order notifications | Recommended |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (localhost or nidastouch.com) | Yes |
| `STRIPE_TAX_ENABLED` | `true` once Stripe Tax is set up | Optional |
| `STRIPE_SHIPPING_RATE` | A Stripe shipping rate id (`shr_...`) | Optional |
| `WAITLIST_WEBHOOK_URL` | Send waitlist signups to Zapier/Sheets | Optional |

---

## 2. Connect Stripe (payments)

I recommend Stripe Checkout: you keep the custom storefront, and the final
secure payment step is hosted by Stripe (cards, Apple Pay, Google Pay, tax,
shipping, receipts). You never touch raw card data.

1. Create a Stripe account at https://dashboard.stripe.com (you do this, not me).
2. Toggle **Test mode** ON (top right) while setting up.
3. Go to **Developers → API keys**. Copy the **Secret key** (`sk_test_...`).
4. Paste it into `.env.local` as `STRIPE_SECRET_KEY`.
5. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local testing.
6. Restart the dev server (`npm run dev`).

That's it — checkout now works in test mode. Use Stripe's test card
`4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

> Prices and products live in `app/nidas/lib/catalog.ts`, not in Stripe. That
> means you do NOT have to recreate products in the Stripe dashboard. The
> server reads the price from the catalog at checkout, so prices can't be
> tampered with from the browser.

### Going live
1. Finish Stripe's account activation (business details, bank account).
2. Switch the dashboard to **Live mode**, copy the live secret key (`sk_live_...`).
3. Put the live key in your production environment variables (e.g. Vercel
   Project → Settings → Environment Variables), and set
   `NEXT_PUBLIC_SITE_URL=https://nidastouch.com`.

---

## 3. Order notifications (webhook)

So you get notified when an order is paid (and can later auto-email customers,
record orders, decrement inventory):

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOURDOMAIN/api/stripe/webhook`
   (for local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
3. Select event: **`checkout.session.completed`**.
4. After creating, copy the **Signing secret** (`whsec_...`) into
   `.env.local` as `STRIPE_WEBHOOK_SECRET`.

The handler is in `app/api/stripe/webhook/route.ts`. Right now it logs paid
orders. When you're ready, tell me and I'll wire confirmation emails and an
order record there.

---

## 4. Shipping & tax (optional but recommended for physical goods)

**Shipping:** Stripe Dashboard → **Products → Shipping rates → Create**. Make a
flat rate (e.g. $8 standard). Copy its id (`shr_...`) into `STRIPE_SHIPPING_RATE`.
Checkout will then collect a shipping address and add the rate.

**Sales tax:** Stripe Dashboard → **Tax** → enable Stripe Tax and set your
origin address. Then set `STRIPE_TAX_ENABLED=true`. Tax is auto-calculated at
checkout. (Leave it `false` until Tax is configured, or checkout will error.)

---

## 5. Managing products

Edit `app/nidas/lib/catalog.ts`. Each product has:

- `slug` — URL id (lowercase, dashes)
- `name`, `subtitle`, `price` (whole USD dollars)
- `sizes` — array shown as the size selector
- `colorName`, `tone` (hex used by the placeholder visual)
- `wash` — `"acid" | "stone" | "heavy" | "raw"` (affects the wash texture)
- `description`, `details` (bullet list)
- `available` — `true` to sell, `false` to show "Waitlist" instead
- `badge` — optional ribbon ("Core", "Dropping Soon")

### Real product photos (when you have them)
Right now each product uses a generated washed silhouette (no photos needed).
When you shoot the real garments (flat-lay, no people per your brief), drop the
images in `public/nidas/` and tell me — I'll swap the placeholder visual for an
image gallery with zoom. 30 minutes of work once photos exist.

---

## 6. Waitlist destination (optional)

Signups are logged server-side now. To collect them somewhere useful without a
database, create a Zapier or Make webhook (or a Google Sheet webhook) and put
its URL in `WAITLIST_WEBHOOK_URL`. Every signup will POST `{ email, product }`.
When you want a proper list (Klaviyo/Mailchimp), tell me and I'll wire it.

---

## 7. About Square

You mentioned you also have Square. The entire storefront is
payment-processor-agnostic — only `app/api/checkout/route.ts` talks to Stripe.
If you'd rather route the money through Square (to keep payouts in one place),
say the word and I'll swap that one file to create a Square Checkout link
instead. Everything else stays identical.

---

## 8. Domains (later)

For now both the studio and the store live in one project:
`leonidastouch.com/` (studio) and `leonidastouch.com/nidas` (store).

When you're ready to put the store on its own domain, point `nidastouch.com` at
the same deployment and add a rewrite so the apex serves `/nidas`. It's a
5-minute change in `next.config.ts` plus a DNS record — tell me and I'll do it.

---

## Quick checklist to go live

- [ ] `STRIPE_SECRET_KEY` (live) set in production env
- [ ] `NEXT_PUBLIC_SITE_URL=https://nidastouch.com`
- [ ] Webhook endpoint added + `STRIPE_WEBHOOK_SECRET` set
- [ ] Shipping rate created + `STRIPE_SHIPPING_RATE` set
- [ ] Stripe Tax enabled + `STRIPE_TAX_ENABLED=true`
- [ ] Real product photos added (optional, looks great without)
- [ ] `npm run build` passes
- [ ] Test a real $1 order, then refund it
