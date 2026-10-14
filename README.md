# Realmsgifts

**Thoughtful gifts. Wherever they are.** A gifting storefront for US shoppers sending gifts to people they love — nearby or abroad.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma + PostgreSQL, Zustand, Paystack and Resend.

## Getting started

```bash
pnpm install          # also runs `prisma generate`
cp .env.example .env  # fill in DATABASE_URL and ADMIN_SECRET_KEY at minimum
pnpm prisma db push   # create/update database tables
pnpm dev
```

Open http://localhost:3000.

- **No database?** The storefront still renders the starter catalogue; checkout, accounts and tracking are disabled with clear messages.
- **No Resend key in development?** The sign-in page shows the magic link on screen instead of emailing it.
- **Local test order:** `pnpm prisma db seed` creates `RG-TESTORDR` / `test@example.com` for trying out Track Order. The seed refuses to run in production.

## Where things live

| What | Where |
| --- | --- |
| Delivery destinations, methods, prices, same-day cutoffs, gift-wrap fee | `src/config/delivery.ts` |
| Announcement, WhatsApp, social links, sample-catalogue notice | `src/config/site.ts` (via `NEXT_PUBLIC_*` env vars) |
| Starter product catalogue and bundles | `src/lib/catalog/products.ts` |
| Categories, occasions (incl. seasonal windows), recipients, budgets | `src/lib/catalog/taxonomy.ts` |
| Filtering, sorting and search | `src/lib/catalog/query.ts` |
| Checkout API (server-side pricing & validation) | `src/app/api/paystack/initialize/route.ts` |
| Payment confirmation (webhook + verify, idempotent) | `src/lib/orders.ts`, `src/app/api/webhook/paystack/route.ts`, `src/app/checkout/complete/page.tsx` |
| Customer sign-in (passwordless email link) | `src/lib/auth.ts`, `src/app/api/auth/*` |
| Staff-only routes | `src/proxy.ts` (`/admin`, `/api/admin`, `/delivery/pod`, `/api/delivery`) |

Products added in the admin dashboard are stored in the database and appear alongside the starter catalogue.

## Security model

- **Prices are never trusted from the browser.** The checkout API re-prices every item from the catalogue and validates options, quantities, destination and delivery method.
- **Orders are only marked paid by Paystack**, via the signature-verified webhook or server-side transaction verification — and only if the amount and currency match what was charged. Both paths are idempotent. Staff cannot set "Paid" manually.
- **Order tracking** requires the order number *and* checkout email, and never returns addresses or payment details. Full order pages are limited to the signed-in owner or staff.
- **Customer data** (orders, recipients, wishlist) is always queried by the signed-in user's id. Sessions use random tokens stored only as SHA-256 hashes in an HttpOnly cookie.
- Card details go directly to Paystack and are never stored.

## Payments (Paystack)

**Flow:** checkout → `POST /api/paystack/initialize` (server re-prices the bag, creates a `PENDING` order, initializes the transaction with the secret key) → customer pays on Paystack Checkout → Paystack returns them to `/checkout/complete` (or there via `cancel_action` if they cancel) → the server **verifies the reference with Paystack** and only then marks the order `PAID`. The webhook (`/api/webhook/paystack`) runs the same verification, so whichever arrives first wins and the other is a no-op.

Order states: `PENDING` → `PAID`, or `PAYMENT_FAILED` (declined), or `CANCELLED` (customer cancelled). A paid amount or currency that doesn't match the order is never marked paid and is flagged for review.

**Keys:** `PAYSTACK_SECRET_KEY` is read only in `src/lib/paystack.ts` (server). `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is the only Paystack value allowed in the browser — the build fails if any `NEXT_PUBLIC_` variable contains an `sk_` key.

**Testing:** start with your **test** secret key (`sk_test_…`) and Paystack's test cards, run through a successful payment, a cancellation and a declined card, then switch to the live key. For fully offline tests, `PAYSTACK_API_BASE` can point at a mock server in development (it's ignored in production).

**Paystack Dashboard → Settings → API Keys & Webhooks:**
- Webhook URL: `https://<your-domain>/api/webhook/paystack` (set it for both Test and Live mode).
- Callback URL: optional — each transaction sends its own (`/checkout/complete`).
- If you charge in USD, make sure USD is enabled on your account; otherwise set `PAYSTACK_CURRENCY` and `PAYSTACK_USD_RATE`.

## Deploying to Vercel

1. Add the environment variables from `.env.example` in Vercel → Settings → Environment Variables.
2. **Update the production database schema once before (or right after) deploying:**
   ```bash
   DATABASE_URL="<production url>" pnpm prisma db push
   ```
   All schema changes are additive (new tables, nullable/defaulted columns, extra enum values), so existing products and orders are preserved.
   Prisma will ask for `--accept-data-loss` because it adds a unique constraint on the new, empty `Order.checkoutKey` column. Nothing is lost: existing rows are all empty (NULL) there, and NULLs never conflict.
3. In the Paystack dashboard, set the webhook URL (see **Payments** above).
4. In Resend, verify the domain used in `EMAIL_FROM`.
5. Deploy. `postinstall` runs `prisma generate` automatically.

## Scripts

| Command | |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm prisma db push` | Sync the database schema |
| `pnpm prisma db seed` | Local test order (development only) |
