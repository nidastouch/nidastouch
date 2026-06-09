# Going Live — your exact setup

What we know about your accounts:

- **nidastouch.com** is already on **Vercel** (running an older version of this app).
- **leonidastouch.com** is on **Squarespace** and empty.

Goal:
- **leonidastouch.com → the studio site**
- **nidastouch.com → the nidas store**

Both are served by ONE deployment. `proxy.ts` decides which to show based on
the domain. Note the role swap: today nidastouch.com shows the studio; after
this goes live it shows the **store**, and leonidastouch.com shows the studio.

> Heads up: when the project was rebuilt, its git history reset, so this code
> is not yet linked to your existing Vercel project. The steps below put it on a
> fresh repo + project, then move both domains over. Clean and reliable.

---

## Step 1 — Put the code on GitHub

I can commit it locally for you on request. Then:

1. Create a new **private** repo at https://github.com/new (e.g. `nidas-touch`).
   Do not add a README/gitignore (the project already has them).
2. Back in this folder, run the commands GitHub shows under
   "…or push an existing repository", which look like:
   ```bash
   git remote add origin https://github.com/<you>/nidas-touch.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2 — New Vercel project from the repo

1. https://vercel.com → **Add New → Project** → import the repo.
2. Framework auto-detects **Next.js**. Don't change build settings.
3. Add **Environment Variables** (use your LIVE values):
   - `STRIPE_SECRET_KEY` = your live key (`sk_live_...`)
   - `NEXT_PUBLIC_SITE_URL` = `https://nidastouch.com`
   - (later, optional) `STRIPE_WEBHOOK_SECRET`, `STRIPE_SHIPPING_RATE`, `STRIPE_TAX_ENABLED`, `WAITLIST_WEBHOOK_URL`
4. **Deploy.** You get a temporary `*.vercel.app` link — open it and test.

---

## Step 3 — Move both domains onto the new project

In the **new** Vercel project → **Settings → Domains**:

1. Add `nidastouch.com` and `www.nidastouch.com`. Vercel will say the domain is
   used by another project of yours and offer to **move it** — confirm. (This
   instantly switches nidastouch.com to the new code.)
2. Add `leonidastouch.com` and `www.leonidastouch.com`. Vercel will show DNS
   records to set, because that domain still points at Squarespace.

---

## Step 4 — Point leonidastouch.com away from Squarespace

In whichever account manages leonidastouch.com's DNS (likely Squarespace
Domains), set the records Vercel gave you, typically:

- `A` record, host `@` → `76.76.21.21`
- `CNAME`, host `www` → `cname.vercel-dns.com`

DNS can take a few minutes to a couple hours. Vercel issues SSL automatically.
When it resolves:

- `https://leonidastouch.com` → studio
- `https://nidastouch.com` → nidas store

---

## Step 5 — Once it's live (optional, later)

- **Webhook** (only needed for order automation, not for selling):
  Stripe → Developers → Webhooks → Add endpoint
  `https://nidastouch.com/api/stripe/webhook`, event `checkout.session.completed`,
  copy the `whsec_...` into Vercel env `STRIPE_WEBHOOK_SECRET`, redeploy.
- **Shipping rate** and **Stripe Tax**: see `NIDAS-STORE-SETUP.md`.
- **Roll the exposed Stripe key** and update the Vercel env var.

---

## Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created, `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_SITE_URL` set
- [ ] Tested on the `*.vercel.app` link
- [ ] nidastouch.com moved to the new project (now shows the store)
- [ ] leonidastouch.com added + Squarespace DNS repointed (now shows the studio)
- [ ] Placed a real test order, then refunded it in Stripe
