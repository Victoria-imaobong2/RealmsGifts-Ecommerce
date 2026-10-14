# MarketAbroad 2.0 — Product Requirements Document (Updated: §28–43 Included)

## Overview
- **Summary**: Premium redesign of the MarketAbroad gifting website targeting an American-first audience, elevating it from a basic Nigerian marketplace MVP to a polished, emotionally-resonant American gift boutique with international delivery capability. Added §28–43 introduces structured delivery tiers, enhanced order tracking, account dashboard with My Recipients, persistent wishlist, premium search overlay, "Help Me Choose" gift finder, updated 18-section homepage sequence, How It Works, Trust section, genuine-reviews policy, WhatsApp floating CTA, and a reusable animation system.
- **Purpose**: Increase conversion, average order value, and trust with US shoppers by repositioning the brand around thoughtful gifting, premium aesthetics, intuitive product discovery, USD-native pricing/checkout while preserving the international differentiator (including African & Nigerian Favorites) as a curated niche category.
- **Target Users**: English-speaking gift shoppers in the United States sending gifts to recipients in the US, Nigeria, UK, Canada, or other configured destinations.

## Goals
1. Reposition the visual identity to a warm-luxury American gifting brand (Deep Forest Green + Warm Ivory + Muted Gold palette; Playfair Display editorial serif headlines + Inter sans-serif).
2. Deliver a complete gifting-oriented information architecture: Shop / Categories / Occasions / Recipients / Budgets / Track Order / About.
3. Convert pricing and checkout from NGN (₦) to USD ($) as the primary display currency while preserving Paystack integration and backend flexibility.
4. Rebuild the homepage to a premium 18-section editorial experience (Announcement bar → Header → Hero → International Gifting → Destination Selector → Delivery Highlights → Shop by Category → Shop by Occasion → Featured Products → Gift Bundles → Shop by Recipient → Shop by Budget → Gift Finder → How It Works → Why Market Abroad → Customer Reviews → Newsletter → Footer).
5. Rebuild the product catalogue with professional filters, sorting, proper product cards (wishlist, availability, delivery eligibility, variant-aware Add-to-Cart).
6. Establish PDP architecture with gallery, variants, gift personalization, delivery eligibility, related products.
7. Implement 4-tier delivery system (Standard/Express/Same-Day/Scheduled) with destination-aware availability, estimates, and pricing.
8. Add polished Order Tracking with 6-step timeline, verification gate, and secure photo-of-delivery display.
9. Upgrade Cart with gift options, remove, save-for-later, subtotal/shipping/tax/total, and optimistic animations.
10. Implement Account Dashboard with My Orders / Track Order / Wishlist / Saved Addresses / Saved Recipients / Gift History / Account Settings — plus a standalone My Recipients feature.
11. Add persistent Wishlist (state + dedicated page) and Premium Search Overlay (products/categories/occasions/recipients suggestions, empty states).
12. Build the "Help Me Choose" deterministic gift finder (Who / Occasion / Budget → curated results).
13. Implement reusable motion system (150–300ms, ease-out/in, prefers-reduced-motion respected, product/category/card/page-transition standards defined).
14. Add floating WhatsApp customer-support CTA (env-configured number, mobile-safe position).
15. Upgrade checkout to a native US address form, USD line items (Subtotal, Shipping, Sales Tax, Total), and Paystack flow in USD.
16. Preserve and augment existing working systems: Zustand cart, Zustand-style persistence, Prisma PostgreSQL schema, existing Paystack endpoints & webhook, admin cookie auth, proof-of-delivery pages, admin dashboard, Resend transactional emails.
17. Maintain lazy DB safety: pages must render without a configured `DATABASE_URL` by falling back to curated static demo data.
18. Achieve WCAG 2.1 AA level.

## Non-Goals
- No backend migration away from Prisma + PostgreSQL or away from Paystack.
- No new payment providers added in this phase.
- No Supabase introduction (the repo uses Prisma-only; do not add a second DB layer).
- No multi-currency UI selector in v2.0 initial (USD single currency display for now).
- No live-inventory multi-warehouse or shipping carrier API integration (destination availability remains config-driven data).
- No full rewrite from scratch; always extend existing files per the Preservation Rules.
- No fake reviews / fake customer counts / fake countries-served stats anywhere.
- No hardcoded secrets or new authentication systems (the existing `ADMIN_SECRET_KEY` cookie-based admin session, and open `USER` role without persistence, are retained and documented).
- No "AI recommendations" label without a live recommendation engine.

## Background & Context
### Current codebase audit summary
- **Framework**: Next.js 16.3.5 App Router (React 19.2.8), TypeScript strict, Turbopack dev server.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`; current palette is Tailwind default `slate` + `blue` (Tailwind blue-600 primary). Typography uses `Inter` (Next font/google) loaded in [layout.tsx](file:///c:/Users/K%20A%20M%20S%20I/Documents/work%20stuff/Realms%20Gifts/MarketAbroad-Shopping-Website/src/app/layout.tsx); globals.css includes a `marquee` keyframes animation.
- **State**: Zustand `useCartStore` at [useCartStore.ts](file:///c:/Users/K%20A%20M%20S%20I/Documents/work%20stuff/Realms%20Gifts/MarketAbroad-Shopping-Website/src/store/useCartStore.ts) (CartItem: id,title,price,image,color,size,quantity; addItem / removeItem / clearCart). **Note**: `ProductSlideCard` bypasses this store and writes to a separate `localStorage` key `cart-storage` directly — a known inconsistency that creates double-cart behaviour and must be reconciled.
- **Database**: Prisma `postgresql` provider with models `User`, `Product`, `ProductVariant`, `Order` (see [schema.prisma](file:///c:/Users/K%20A%20M%20S%20I/Documents/work%20stuff/Realms%20Gifts/MarketAbroad-Shopping-Website/prisma/schema.prisma)). Missing fields needed for 2.0: category, subcategory, occasion, recipient, currency, sku, ratings meta, dimensions, variants expansion, bundles, wishlist, saved addresses, saved recipients, reviews, delivery tier meta on Order, order verification token.
- **Auth**: `/api/auth/login` — if password === `process.env.ADMIN_SECRET_KEY`, issue 7-day httpOnly cookie `admin_session`; else always returns USER role (no user creation / password DB yet). Admin-only endpoints: `/api/admin/products` POST and `/api/admin/orders` GET+PATCH verify the cookie.
- **Payments**: `/api/paystack/initialize` creates `Order(status=PENDING)`, calls Paystack `/transaction/initialize` **in kobo (NGN subunit)**, writes `paymentRef`. Webhook `/api/webhook/paystack` verifies HMAC-SHA512 signature, marks `PAID`, sends a Resend confirmation email. **IMPORTANT v2.0 note**: Paystack supports `currency: "USD"` for USD merchants; the flow must switch to sending USD amounts in cents *and* set the currency field explicitly.
- **Delivery**: Checkout LOCATIONS constant is hardcoded Nigeria-only (Lagos/Abuja/PH/Owerri) with NGN fees and same-day flag — must be replaced by a configurable destinations data source with 4-tier delivery (Standard/Express/Same-Day/Scheduled) and USA-first defaults.
- **Pricing display**: The entire UI currently formats with `₦` prefix — 2.0 flips to `$` prefix with USD formatting everywhere via a shared currency formatter.
- **Proof of Delivery**: `/delivery/pod/[id]` page works with canvas signature and photo upload + `/api/delivery/pod` sets Order status to DELIVERED and stores `podSignature` / `podPhoto`. Must be gated on Track Order by a verification field.
- **Admin UI**: `/admin` with tabs Products / Orders / Add-Product. Use as-is but extend fields to match expanded schema and USD currency.
- **Env required (none present locally today)**: `DATABASE_URL`, `ADMIN_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-time: with none set, all public pages must still render.
- **Current page routes**: `/`, `/catalog`, `/cart`, `/checkout`, `/login`, `/profile`, `/orders/[id]`, `/delivery/pod/[id]`, `/admin`, `/api/*`. No dynamic `product/[id]` PDP, `/wishlist`, `/account`, `/track`, `/gift-finder`, `/search` yet.
- **SEO / metadata**: Metadata `title="Realms Gift | Fast Delivery Marketplace"`; description reads as a parcel courier, not a gifting brand. Meta `themeColor` is in deprecated `metadata` field; Next 16 warns to move to `viewport` export.
- **MenacGifts reference**: MenacGifts is approved as the UX/IA/aesthetic bar. All assets and text are original Market Abroad brand.

## Functional Requirements (Updated v2 with §28–43)
- **FR-1 Brand System**: Establish a reusable design system (warm luxury palette tokens via Tailwind CSS v4 `@theme`, typography tokens for Playfair Display serif + Inter sans-serif, spacing/radius/shadow tokens, motion easing/duration constants) wired into [globals.css](file:///c:/Users/K%20A%20M%20S%20I/Documents/work%20stuff/Realms%20Gifts/MarketAbroad-Shopping-Website/src/app/globals.css) and available everywhere.
- **FR-2 Header / Top Announcement**: Configurable announcement bar (tagline "Thoughtful gifts. Wherever they are."). Full premium nav with logo MARKET ABROAD, Home/Shop/Categories/Occasions/Gifts-for-Her/Gifts-for-Him/Track-Order/About. Right rail: Search (functional overlay), Wishlist (functional state + persistence), Account (links to `/login` + auth-aware), Cart with live item count from the single reconciled cart store.
- **FR-3 Mobile Header & Drawer**: Sticky mobile header Menu/Logo/Search/Cart. Slide-in drawer with full IA, focus management, Escape + backdrop-click close, body scroll lock, proper focus trapping. Menu items: Shop/Categories/Occasions/Gifts-for-Her/Gifts-for-Him/Track-Order/About/Contact.
- **FR-4 Hero**: Editorial split hero. Headline "Thoughtful gifts. Wherever they are.", subcopy, SHOP GIFTS primary CTA + SHOP BY OCCASION secondary CTA, high-quality lifestyle hero image. Stack gracefully on mobile. Subtle fade-in entrance animations ≤ 400ms; no parallax.
- **FR-5 "Wherever They Are" International Gifting Section**: Headline + body that frames international gifting without dominating. Destination chips for USA/Canada/UK/Nigeria/+N from configurable data with clear "Available destinations" language (no "Worldwide" claim unless actually configured).
- **FR-6 Destination Selector**: "Where are you sending your gift?" form for Country/City/ZIP. USA as default recipient context; US has full Street/Apt/City/State/ZIP; other destinations adapt fields. Controls product availability/shipping/delivery estimates per destination.
- **FR-7 Delivery Highlights**: Between destination selector and Shop-by-Category, show a compact 4-column delivery tier highlight strip (Standard/Express/Same-Day/Scheduled icons + short copy) linking to the delivery option definitions in checkout.
- **FR-8 Shop-by-Category Section**: "Find something they'll love." grid of 18 category cards including "African & Nigerian Favorites" as a normal, non-dominating category. Each card: image, name, short description, (optional) product count, arrow CTA, hover 1.03–1.06 zoom + elevation lift 200–300ms transitions. Arrow moves 3–5px on hover. Title has subtle transition.
- **FR-9 Shop-by-Occasion Section**: 18 occasion cards with imagery, title, emotional description, deep links to filtered catalogue with `occasion=X` query param.
- **FR-10 Featured Products**: Editorial "Editor's Picks" / Featured products grid (8–12) from catalogue with formatUSD + wishlist + add-to-cart animations.
- **FR-11 Gift Bundles**: Curated bundles section (Birthday Box, Self-Care, Anniversary, For Him, For Her, Long-Distance Love). Each bundle lists included items, bundle price, genuine savings (if sum individual > bundle), destination availability, personalization.
- **FR-12 Shop-by-Recipient Section**: "Who are you shopping for?" — 11 recipient cards (Her/Him/Mom/Dad/Partner/Friend/Grandparent/Coworker/Kids/Family/Couples) with imagery and catalogue links.
- **FR-13 Budget Shopping Section**: "Gifts for every budget" — 5 tiers Under $25 / $25–50 / $50–100 / $100–200 / $200+ with catalogue filter links.
- **FR-14 Gift Finder / Help-Me-Choose**: "Not sure what to get?" three-step deterministic quiz: (1) Who (8 options), (2) Occasion (6 options + Other), (3) Budget (4 tiers). Results page shows a curated, filtered product list based on the answers. Labeled clearly as "Curated Recommendations" — no AI branding.
- **FR-15 How It Works**: "Giving is easy." 4 numbered steps (01 Choose → 02 Add details/msg → 03 Choose delivery → 04 Track). Icons, subtle reveal-on-scroll animations, editorial feel.
- **FR-16 Trust / Why Market Abroad**: "Why shop with Market Abroad?" — 6 real capabilities only: Secure Checkout, Clear Delivery Information, Personalized Gifting, Order Tracking, Responsive Customer Support, Carefully Curated Products. No invented customers/countries/ratings/partnerships.
- **FR-17 Customer Reviews**: If real seeded/DB reviews exist: Rating, Review, Customer name, Product, Date. Otherwise: "Customer reviews coming soon." callout or hidden. Never display fabricated reviews.
- **FR-18 Newsletter + Footer**: Newsletter section (per O2 default, UI disabled placeholder "Coming soon"). Footer with brand blurb, shop/categories/occasions links, Track Order, WhatsApp callout, copyright.
- **FR-19 Product Catalog + Filters/Sort**: `/catalog` server-renders products, hydrates CatalogClient. Filters: Category, Occasion, Recipient, Price, Availability, Delivery location. Sort: Recommended / Newest / Price ↑↓ / Featured.
- **FR-20 Product Card (Catalogue)**: Image, wishlist heart button (stateful + 150ms scale animation), title, category, USD price (strike-through previous only on real discount), availability badge, destination-aware delivery estimate CTA, Add to Cart or Choose Options depending on variants. Hover: image scale(1.04), button slight up movement, add-to-cart small confirmation "Added to cart ✓" toast; data operation immediate, animation feedback only.
- **FR-21 Product Image System**: Consistent aspect ratio, `object-cover`, meaningful `alt`, lazy below-fold, `sizes` attrs, no mismatched images. Multi-image array stored.
- **FR-22 Product Information Model**: Extend Prisma Product model additive fields (see AC-12 complete list).
- **FR-23 Product Detail Page (PDP)**: New `/product/[id]` route with gallery/variants/qty/delivery-eligibility/personalization/add-to-cart/tabs/related.
- **FR-24 Gift Personalization**: Gift-wrap toggle, Recipient name/phone, gift message, sender name, hide-price toggle, delivery date, instructions.
- **FR-25 Seeded Catalogue**: 40–60 products across 18 categories USD $24.99…$199.99, accurate imagery, variants, SKU. Shared fallback for no-DB.
- **FR-26 USD Pricing Everywhere**: New `formatUSD()` utility; replace every `₦…`; Paystack init `currency:"USD"` + cents.
- **FR-27 Four-Tier Delivery (§28)**: Choose-Your-Delivery options on Checkout AND PDP delivery block: Standard Delivery, Express Delivery, Same-Day Delivery, Scheduled Delivery. Only show options available for the destination + product combination. Display Estimated arrival date, Shipping price, Delivery window, Restrictions. When same-day unavailable: "Same-day delivery isn't available for this item or destination." Never invent times.
- **FR-28 Track Order Polished Page (§29)**: `/track` route. Inputs: Order Number + verification field (e.g. email or order-token stored on Order at creation; never expose POD or internal data to anyone guessing order #). Timeline of 6 states: Order Received → Payment Confirmed → Preparing Your Gift → Ready for Delivery → Out for Delivery → Delivered. Only display states actually recorded in the backend (no empty dots filled in pre-emptively beyond PENDING). If POD photo/signature exists, display it only AFTER the user passes verification.
- **FR-29 Cart Improvements (§30)**: `/cart` page: product image, name, variant, quantity (+/-), unit price, line total, gift options chip, Remove, Save for Later. Summary: Subtotal, Shipping estimate, Taxes (where calculated), Total. CTA PROCEED TO CHECKOUT. All cart updates must happen without page refresh. Subtle animations on: item added, qty change (+/-1 flash), item removed (fade-out + slide-up).
- **FR-30 Account Dashboard + My Recipients (§31)**: Preserve existing auth. `/account` dashboard nav: My Orders / Track Order / Wishlist / Saved Addresses / Saved Recipients / Gift History / Account Settings. Standalone "My Recipients" feature: users can save recipients with name/phone/address/nickname. Example preset nicknames: Mom, Dad, Partner, Friend, Family. Row-level security: customers only access THEIR own saved recipients/addresses/wishlist (backend filter by user id; for v2.0 initial USER role without persisted users, scoping is by email/guest-session cookie).
- **FR-31 Wishlist (§32)**: Heart icon on every product; click toggles with a subtle fill/scale animation. Dedicated `/wishlist` page: image, name, price, availability, Add to Cart, Remove. Persist for authenticated users; for v2.0, cross-back via Zustand localStorage persistence + optional Prisma model forward-compat.
- **FR-32 Premium Search Overlay (§33)**: Header search icon → full overlay "What are you looking for?". Live-typed results include: Product suggestions, Category suggestions, Occasion suggestions, Recipient suggestions. Natural search-term matches: "Birthday", "Mom", "Perfume", "Chocolate", "Jewelry", "Gift box", "Under $50", etc. Useful empty states with recommendations.
- **FR-33 WhatsApp Customer Support Floating Button (§39)**: Desktop fixed bottom-right floating button "💬 Chat with us" + tooltip open to `wa.me/{NEXT_PUBLIC_WHATSAPP_NUMBER}`. Mobile: bottom-right but positioned NOT to overlap checkout CTAs (either y-offset above sticky bottom, or z-index-aware/hide on checkout scroll position). Never hardcode fake number; read from `NEXT_PUBLIC_WHATSAPP_NUMBER` env.
- **FR-34 Animation / Motion System (§40–43)**: Reusable motion tokens in Tailwind @theme: durations 150/200/250/300ms, ease-out for enter, ease-in for exit. Product card hover: img scale(1.04), button slight up, wishlist scale feedback, price no animation, add-to-cart confirmation "Added to cart ✓" tick. Category card hover: image zoom, shadow, arrow 3–5px, title subtle. Page transitions: subtle fade/slide (150–200ms) between routes; shopping must feel fast — never slow. All animations gated on `prefers-reduced-motion: reduce`.
- **FR-35 American Checkout (§27 FR-20)**: USA-first fields: First/Last, Email, Phone, Street, Apt/Suite/Unit, City, State (50 states), ZIP. Summary Subtotal/Shipping/Discount/Est Sales Tax/Total, Paystack USD.
- **FR-36 Cart Consistency**: Zustand single-source of truth, no localStorage bypass.
- **FR-37 Admin Catalog Panel**: Extended fields, USD formatting, DISPATCHED status harmonization.
- **FR-38 SEO & Metadata**: Rewritten metadata + viewport export split, route-level metadata, OG/Twitter.

## Non-Functional Requirements
- **NFR-1 Performance**: LCP < 2.5s 4G mobile for home + PDP + cart.
- **NFR-2 Accessibility**: WCAG 2.1 AA — body text ≥ 4.5:1, large text ≥ 3:1, focus styles, keyboard reach, form labels, drawer focus-trap, alt text, ARIA live for toasts (add-to-cart, wishlist confirm).
- **NFR-3 Graceful Degradation Without DB**: Every public server page renders HTTP 200 when `DATABASE_URL` is absent using static fallbacks (including /account /track /wishlist /gift-finder /search — they just gracefully show "Sign in to save" or empty-but-useful states). Zero Prisma errors to users or in server logs.
- **NFR-4 Security (updated)**: No secret exposure. Paystack webhook HMAC preserved. **NEW: Track Order verification — you must prove the request is authorized (email match, token match, or signed cookie) before showing POD photos or detailed recipient address.** New My Recipients / Saved Addresses: server endpoints filter BY user-id (or email for guest v2.0) never SELECT *. Personalization uploads: client-preview-only with size ≤ 5MB + MIME-type whitelist for v2.0.
- **NFR-5 Mobile Responsiveness**: 320px→4K usable. Mobile drawer required. Floating WhatsApp button must NOT cover checkout primary CTAs on ≤ 430px viewports.
- **NFR-6 Motion (expanded)**: Motion tokens in one place (theme). Animations gated on prefers-reduced-motion. No bounce, no parallax, no loops. Page transitions <250ms.
- **NFR-7 Maintainability**: All IA arrays (Categories/Occasions/Recipients/Budgets/Destinations/DeliveryTiers/TrustFeatures/HowItWorksSteps) as single exported sources in `src/lib/*.ts`. Currency/formatters/motion single sources.
- **NFR-8 Type Safety**: Strict TS, no untyped API bodies, typed API contracts.
- **NFR-9 Genuine Stats Only (new)**: No fake reviews/countries/customers served/counts anywhere. Stringent zero-fabrication enforcement on Trust section and Reviews section.

## Constraints
- **Technical (T)**:
  - T1. Stack locked: Next.js 16 App Router, Tailwind v4, Zustand, Prisma 6, Paystack, Resend, Lucide React, next/font/google.
  - T2. No new package without justification; first check if clsx/tailwind-merge or CSS keyframes can deliver a feature before adding framer-motion. If animations are complex and framer-motion cost is justified, document T2 justification in the task.
  - T3. Prisma additive schema only — never drop an existing column.
  - T4. Read Next 16 `node_modules/next/dist/docs/` before writing route/layout code; respect metadata vs viewport.
  - T5. Reuse lazy-safe Prisma proxy singleton; never instantiate a second PrismaClient.
- **Business (B)**:
  - B1. American-first gifting brand. Nigeria defaults nowhere.
  - B2. No fake reviews / brands / discounts / bestseller badges / urgency countdowns (existing same-day tied to logistics cutoff OK).
  - B3. No MenacGifts proprietary asset copy; inspiration-only.
  - B4. USD sole customer-facing displayed currency.
  - B5. **NEW (§37/§38)**: No invented customer counts, country counts, order counts, star-rating aggregates, or partnerships — only capabilities actually implemented.
- **Dependencies (D)**:
  - D1. `DATABASE_URL` env; D2. Paystack USD merchant; D3. env set; D4. `NEXT_PUBLIC_WHATSAPP_NUMBER` configured for floating CTA.

## Assumptions
- A1. Prisma PostgreSQL retained.
- A2. Existing open USER role = "guest with email-based order tracking" — retained.
- A3. Wishlist/MyRecipients/SavedAddresses v2.0 initial Zustand+localStorage fine; schema additive columns forward-compat for eventual DB.
- A4. Delivery Tier availabilities come from `DELIVERY_TIERS` typed config in destinations module; destination+product combo gating.
- A5. Dev placeholders labeled clearly; image→product match guaranteed.
- A6. Client search is acceptable initially.
- **A7 (new)**: Track Order verification uses "email match" pattern for v2.0: user enters order id + email; server verifies order.email === input email before returning full order + POD photo.
- **A8 (new)**: Gift finder is purely deterministic (filter predicate on recipients+occasions+price band); no AI.
- **A9 (new)**: Reviews section v2.0 initial = "Customer reviews coming soon." callout; no fabricated testimonials.
- **A10 (new)**: Page transitions use CSS `transition` or Next Suspense fallback fade; only add framer-motion if necessary.

## Open Questions
- [ ] **O1 — Personalization file upload**: Server-API or client-preview-only? *Default: client-preview-only with TODO.*
- [ ] **O2 — Newsletter Footer**: Real Resend endpoint or placeholder? *Default: placeholder "Coming soon".*
- [ ] **O3 — Brand rename**: MARKET ABROAD everywhere? *Default: MARKET ABROAD primary, Realms Gifts sub-head if useful.*
- [ ] **O4 — Same-day banner behavior with destination context**: *Default: premium destination-aware callout tied to selected destination.*
- [ ] **O5 — Retire BottomNav vs themed-retention?** *Default: retire render, keep code.*
- [ ] **O6 (new) — framer-motion**: Add as dependency for drawer / gift finder / page transitions, OR deliver with pure Tailwind transitions + CSS keyframes? *Default: pure CSS + Tailwind transition tokens only to keep TCO low; add framer-motion only if a specific feature is otherwise impossible (document reasoning).*
- [ ] **O7 (new) — Track Order verification method**: Email-match vs order-secret-token sent to email vs signed short-lived cookie? *Default: email-match for v2.0; admin email-resend of tracking-link future work.*
- [ ] **O8 (new) — Reviews section on home**: Hide section entirely OR show "Customer reviews coming soon." CTA card? *Default: show 1 elegantly-styled "Coming soon" block so layout remains balanced.*
- [ ] **O9 (new) — My Recipients row-level access for guest USER role**: Scope by session-id cookie + stored email hash vs loose match? *Default: simple localStorage scoping for v2.0 guest + server-side user-id filter logic scaffolded for a future persisted-accounts release.*

## Acceptance Criteria (New ACs 16–28 added)

### AC-1: Warm Luxury Design System Applied Globally
- **Type**: `rubric`
- **Dimension**: Brand visual system consistency across pages and components.
- **Scale**: 1-5
- **Anchors**: 1 = still Tailwind default slate/blue; 3 = palette/fonts changed but inconsistent; 5 = palette/tokens/typography/elevations/motion universally applied, zero legacy slate/blue references outside deprecation comments.
- **Pass Threshold**: >= 4
- **Evidence**: Visual screenshots; `globals.css` showing `@theme`; grep `text-blue-600 / bg-blue-600 / bg-slate-50` → 0 matches.

### AC-2: No Pounds-Naira (₦) Currency Symbol on Any Customer-Facing Page
- **Type**: `rule`
- **Given**: Any DB state.
- **When**: Navigate every customer route, open modals/drawer.
- **Then**: `₦` never appears; all prices `$X.XX` via formatUSD.
- **Pass Condition**: Grep `₦` in src returns 0 (except inside clearly-marked legacy comment blocks).
- **Evidence**: Grep output + screenshots of home/catalog/cart/checkout/orders/admin.

### AC-3: Full Information Architecture in Header + Mobile Drawer
- **Type**: `rule`
- **Given**: Desktop ≥1024px and mobile ≤640px.
- **When**: Inspect navbar + drawer.
- **Then**: Desktop nav: Home/Shop/Categories/Occasions/Gifts-for-Her/Gifts-for-Him/Track-Order/About; right: Search/Wishlist/Account/Cart(live). Mobile drawer: Shop/Categories/Occasions/Gifts-for-Her/Gifts-for-Him/Track-Order/About/Contact. Drawer: Esc/backdrop/X all close; body scroll locked; focus trap; focus restore.
- **Pass Condition**: All IA present; interactively verified close-methods + scroll-lock.
- **Evidence**: Snapshots + close-test notes.

### AC-4: Homepage 18 Editorial Sections in Correct Order, CTAs Navigate to Working Destinations
- **Type**: `rule`
- **Given**: `/` loaded.
- **When**: Scroll top→bottom; click each section CTA.
- **Then**: Order = (1) Announcement bar (2) Header (3) Hero (4) International Gifting (5) Destination Selector (6) Delivery Highlights (7) Shop by Category (8) Shop by Occasion (9) Featured Products (10) Gift Bundles (11) Shop by Recipient (12) Shop by Budget (13) Gift Finder (14) How It Works (15) Why Market Abroad (16) Customer Reviews (17) Newsletter (18) Footer. Every CTA navigates without 404. Home has visual rhythm: alternate light/ivory/editorial-section bg breaks.
- **Pass Condition**: All 18 sections present. Click trace: 3 CTAs navigate to correct filtered catalogue/route with state.
- **Evidence**: Full-page section-annotated screenshot + 3 navigations (Category Fl, Gift Finder start, Help-Me-Choose).

### AC-5: 18×18×11×5 Cards Complete with Correct Hover (Image/Category) Animations (§42)
- **Type**: `rubric`
- **Dimension**: Completeness + visual quality of shop-by sections and motion quality.
- **Scale**: 1-5
- **Anchors**: 1 = <50% sections; 3 = all counts present but generic copy/inconsistent hover; 5 = exact counts, each unique appropriate image, matched description, smooth 200–300ms hover (image zoom 1.03–1.06 + elevation, arrow 3–5px translate, title subtle opacity/translate). Mobile does not rely on hover (active-state fallback exists).
- **Pass Threshold**: >= 4
- **Evidence**: DOM count snapshot + 3-card before/after hover.

### AC-6: Catalogue Filter/Sort + Wishlist + Add-to-Cart Feedback Animations (§41)
- **Type**: `rule`
- **Given**: `/catalog` with ≥40 seeded products.
- **When**: Apply Category filter, Occasion filter, Price min/max; sort Price Lo→Hi then Hi→Lo; click Wishlist + Add-to-Cart on 3 products; open header wishlist.
- **Then**: Filter/sort work; Wishlist heart fills with 150ms scale animation + persists across reload (Zustand store). Add-to-cart: store update IMMEDIATE, button shows spinner → "Added to cart ✓" tick animation (≤1.2s), cart badge live update, no page reload. On product hover: image scale(1.04), button slight upward translate. Price is not animated.
- **Pass Condition**: End-to-end; cart badge 0→3; wishlist store has 3; post-reload retained.
- **Evidence**: Filter+sort trace screenshots; storage snapshot post-interaction.

### AC-7: PDP with Gallery + Variants + Personalization + Related
- **Type**: `rule`
- **Given**: Product with variants + 3 images + 4 related.
- **When**: Visit `/product/[id]`.
- **Then**: Gallery 1 main + clickable thumbs; variants picker; qty; delivery-eligibility block per FR-27 (4 tiers with estimates for destination context); personalization block; Add-to-Cart + Buy-Now. Tabs: Description / Details / Delivery / Returns / Reviews placeholder / Related. Personalization fields: recipient name, phone, message, sender, gift wrap, hide-price toggle, delivery date, instructions.
- **Pass Condition**: All elements render; variants change payload; add-to-cart store update correct; related link correctly.
- **Evidence**: Screenshot; gallery thumb click updates img src.

### AC-8: USD American Checkout + Paystack Init USD Cents + Sales Tax Line (§27)
- **Type**: `rule`
- **Given**: Cart ≥1 item.
- **When**: Proceed to `/checkout`; fill US form; inspect summary; trace /api/paystack/initialize payload.
- **Then**: US States dropdown (50+DC+territories), ZIP, Apt, labels, validation. Summary: Subtotal / Shipping / Discount / Estimated Sales Tax / Total, all `$X.XX`. Paystack init body: `{ email, amount: <total cents>, currency: "USD", … }`.
- **Pass Condition**: Form required-field validation triggers; summary 4 USD lines; payload currency="USD".
- **Evidence**: Snapshot of summary + intercepted payload (or server log).

### AC-9: Zustand Cart Single Source of Truth — No localStorage Bypass
- **Type**: `rule`
- **Given**: Persistence-wired Zustand store.
- **When**: Add from (a) Featured, (b) Catalogue, (c) PDP; go to /cart; refresh.
- **Then**: Same items across all paths. Zustand store.items === what Cart page renders. ProductSlideCard does not call localStorage.setItem('cart-storage'…). Cart animations on +/-/remove (§30): qty change flash, remove fade-slide-up. No page refresh.
- **Pass Condition**: Store snapshot matches DOM; ProductSlideCard source has no localStorage bypass; animations visible on interaction.
- **Evidence**: Code grep + store snapshot.

### AC-10: Graceful Degradation — All Public Pages HTTP 200 without DATABASE_URL (Extended Scope)
- **Type**: `rule`
- **Given**: DATABASE_URL unset.
- **When**: curl `/`, `/catalog`, `/cart`, `/checkout`, `/product/[fallback-id]`, `/profile`, `/account`, `/track`, `/wishlist`, `/gift-finder`, `/search`, `/login`, `/orders/bogus-id`.
- **Then**: All HTTP 200. Pages render meaningful empty/guest states. Server stderr zero PrismaClientInitializationError. Browser console zero DB errors.
- **Pass Condition**: 12 routes HTTP 200; grep server stderr for Prisma error → 0.
- **Evidence**: curl status lines; server stderr snippet.

### AC-11: Accessibility WCAG 2.1 AA
- **Type**: `rule`
- **Given**: Home, catalog, PDP, checkout, search overlay, gift finder, drawer.
- **When**: axe-equivalent + manual keyboard + drawer + mobile.
- **Then**: 0 serious axe violations; body contrast ≥4.5:1; every interactive reachable via Tab with visible focus; drawer Esc/backdrop/X + focus trap + scroll lock. ARIA live toasts for add-to-cart/wishlist confirm.
- **Pass Condition**: 0 serious violations; manual pass keyboard.
- **Evidence**: Diagnostic report + focused-state screenshots.

### AC-12: Prisma Schema Additive Expansions (All New Models Included) + DISPATCHED/SHIPPED Harmonize
- **Type**: `rule`
- **Given**: `prisma/schema.prisma`.
- **When**: `prisma validate`.
- **Then**: Product additive fields (category, subcategory, occasions, recipients, sku, currency, materials, dimensions, weight, ingredients, careInstructions, personalizable, giftWrapAvailable, destinationAvailability, relatedProductIds, ratingAvg, ratingCount). ProductVariant retained. NEW forward-compatible additive models: `WishlistItem`, `SavedRecipient`, `SavedAddress`, `Review` (optional, all additive, no existing FKs touched), `Order.verificationToken String?` for Track Order gating. Order status remains PENDING/PAID/DISPATCHED/DELIVERED; Admin UI select option harmonized DISPATCHED not SHIPPED. No existing field dropped.
- **Pass Condition**: prisma validate exit 0; additive-only diff; schema new fields/models enumerated all present.
- **Evidence**: validate output + schema line references; git diff shows no `-` field lines.

### AC-13: Paystack Init USD Cents + currency Param; Webhook Signature + Amount Display Unchanged Logic
- **Type**: `rule`
- **Given**: $79.99 cart.
- **When**: Call initialize endpoint.
- **Then**: Paystack body `amount: 7999, currency: "USD"`; order total stored 79.99 USD float. Webhook signature check lines 12-20 identical preserved; email body USD formatted totals, not ₦.
- **Pass Condition**: Outbound body contains `currency: "USD"`; webhook signature check unchanged.
- **Evidence**: Server console of Paystack body; signature-check source lines.

### AC-14: Metadata + Viewport Export Separation. No Next themeColor Deprecation Warning. Branded Metadata.
- **Type**: `rule`
- **Given**: Fresh next dev, clean tab.
- **When**: Load homepage; inspect console + layout exports.
- **Then**: themeColor deprecation warning gone. Metadata title = "Market Abroad — Thoughtful gifts. Wherever they are."; description = gifting positioning; viewport export object includes themeColor "#173F35"; OG + Twitter present.
- **Pass Condition**: Console clean of warning.
- **Evidence**: Console messages screenshot; layout exports review.

### AC-15: Seeder Produces 40–60 Realistic USD Products Across 18 Categories, Even Distribution, Correct Images
- **Type**: `rubric`
- **Dimension**: Seed completeness, distribution, image correctness.
- **Scale**: 1-5
- **Anchors**: 1 = <20 products; 3 = 40-60 but uneven distribution/image mismatches; 5 = ≥45 products even across 18 categories (African&Nigerian ≤15% of total), prices span all 5 budget bands, SKU set, variants present per applicable, 0 image-category mismatches (perfume≠watch, cake≠flowers).
- **Pass Threshold**: >= 4
- **Evidence**: Per-category count table; sample 10 products image-match verified visually.

### AC-16: Four-Tier Delivery (§28) — Availability, Estimates, Pricing, Unavailable Messaging
- **Type**: `rule`
- **Given**: Product + destination matrix (e.g., USA-Los Angeles vs Nigeria-Abuja, and a perishable item like flowers).
- **When**: Render PDP delivery block + Checkout delivery chooser for both destinations.
- **Then**: Tiers available = only the ones configured for destination+product combo. Each tier displays: Estimated arrival date (real calendar calc), Shipping price (USD), Delivery window text, Restrictions. For unavailable Same-Day, explicit copy "Same-day delivery isn't available for this item or destination." NO invented times — all numbers/strings from DELIVERY_TIERS config.
- **Pass Condition**: Same-Day unavailable copy appears in test matrix; tier data from config.
- **Evidence**: Screenshots of 2 destination contexts + DELIVERY_TIERS typed file.

### AC-17: Track Order Polished Page + Verification Gate + Secure POD Photo Display (§29)
- **Type**: `rule`
- **Given**: An existing order with known id=ORD-1234 and email=alice@example.com, and POD photo attached.
- **When**: Scenario 1 — user enters ORD-1234 + WRONG email → reject. Scenario 2 — user enters ORD-1234 + correct email → allow. Scenario 3 — try direct URL /orders/ORD-1234?hack=true without verification → POD photo NOT rendered (or blurred/placeholder).
- **Then**: Timeline of up to 6 states: Order Received → Payment Confirmed → Preparing Your Gift → Ready for Delivery → Out for Delivery → Delivered. Only backend-recorded states are highlighted (others gray/disabled). POD photo shown only if verification passed.
- **Pass Condition**: Scenario 1 rejected; 2 full timeline + POD photo rendered; 3 POD NOT rendered.
- **Evidence**: 3 screenshots + server-side authorization check code.

### AC-18: Cart Improvements + Animations on Add/Qty Change/Remove (§30)
- **Type**: `rule`
- **Given**: Cart with 2 items.
- **When**: Qty +1 on item 1, then -1; remove item 2; add gift option for item 1; hit PROCEED TO CHECKOUT.
- **Then**: Columns: image, name, variant, qty, unit price, line total, gift option chip, Remove, Save for Later (Save-for-Later wireframe state: "Saved" label, not implemented logic OK for v2.0). Summary: Subtotal, Shipping estimate, Taxes, Total in USD. No page reload on any mutation. Animations: qty change → 150ms flash background; remove → 250ms fade-out + slide-up; PROCEED TO CHECKOUT navigates to `/checkout` with cart intact.
- **Pass Condition**: No reload; DOM matches calculations; animations observed; navigation works.
- **Evidence**: Interaction recording/screenshots; animation classes present.

### AC-19: Account Dashboard + Row-Level Secure My Recipients (§31)
- **Type**: `rule`
- **Given**: Two distinct users/guest sessions: A (alice@… saved Mom recipient) and B (bob@… saved Dad recipient).
- **When**: Visit `/account`; nav: My Orders, Track Order, Wishlist, Saved Addresses, Saved Recipients, Gift History, Account Settings — all links render (OK if some show Sign-in CTA v2.0 guest empty state). Add recipient "Mom" with details as A; switch context to B and read list.
- **Then**: Dashboard renders the 7 nav items. My Recipients: UI for add/edit/delete; presets suggested (Mom, Dad, Partner, Friend, Family). Row-level secure: B cannot see A's saved Mom recipient (server filter + client Zustand scoping).
- **Pass Condition**: Dashboard structure correct; recipient isolation works (storage snapshot of A vs B disjoint sets).
- **Evidence**: Account screenshot + storage disjoint-sets proof.

### AC-20: Wishlist (§32) — Every Product Heart Toggle + Dedicated Page + Persistent
- **Type**: `rule`
- **Given**: Browser open; click 4 wishlist hearts in catalogue; navigate `/wishlist`; refresh.
- **Then**: Each heart toggle fills/empties with subtle scale animation. Wishlist page shows image, name, USD price, availability badge, Add to Cart CTA, Remove CTA. After refresh wishlist retained 4 items. Add-to-cart from wishlist moves (or copies, per documented UX) item to cart + removes count.
- **Pass Condition**: 4 toggle interactions; wishlist page render; reload persistence; Add-to-cart from wishlist works.
- **Evidence**: Screenshots; storage snapshot.

### AC-21: Premium Search Overlay (§33) — 4 Suggestion Types + Empty States
- **Type**: `rule`
- **Given**: Header search icon click.
- **When**: Type "Birthday", "Mom", "Perfume", "Chocolate", "Jewelry", "Gift box", "Under $50". Clear. Type "zzzzz".
- **Then**: Overlay opens; placeholder "What are you looking for?". Results have 4 sections with suggestion chips/rows: Products, Categories, Occasions, Recipients. Natural-language mapping: "Under $50" routes to budget-filtered catalogue; "Birthday" routes occasion-filtered + products tagged. Typing "zzzzz" → useful empty state with top categories/trending suggestions.
- **Pass Condition**: 4 sections visible on 1+ search; "Under $50" routes to min/max filter; empty state rendered for zzzzz.
- **Evidence**: Screenshots of search result, empty state, Under $50 navigation.

### AC-22: "Help Me Choose" Gift Finder (§34) — 3-Step Deterministic Curated Results
- **Type**: `rule`
- **Given**: `/gift-finder` or home inline CTA.
- **When**: Select (Her, Anniversary, $100–$200) and submit.
- **Then**: UI labeled "Curated Recommendations" — NO "AI recommendations" copy anywhere. Result list filters recipients + occasions + price band, shows matched products. Steps: Who (8 options including Coworker/Family), Occasion (6 + Other), Budget (4 tiers: <$25, $25–50, $50–100, $100+).
- **Pass Condition**: Result set correctly filtered; UI copy never claims AI.
- **Evidence**: Answers→Result filters trace; screenshot of copy text.

### AC-23: Genuine Trust Section (§37) and Genuine Reviews (§38) — Zero Fabrication
- **Type**: `rule`
- **Given**: Home sections 15 (Trust) + 16 (Reviews).
- **When**: Read the copy.
- **Then**: Trust section lists exactly 6 real capabilities implemented: Secure Checkout, Clear Delivery Information, Personalized Gifting, Order Tracking, Responsive Customer Support, Carefully Curated Products. Zero "X+ countries", "Y customers served", "Z 5-star ratings", "Partner with DHL/UPS" fabrications. Reviews section either hidden OR "Customer reviews coming soon." elegantly styled placeholder — never fake names/review bodies.
- **Pass Condition**: Grep for regexp `\d+\+?\s*(customer|countr|order|review|star|rating)` and any known logistics brand names → 0 matches. Reviews section has no fake names.
- **Evidence**: Grep outputs; copy screenshots.

### AC-24: Floating WhatsApp CTA (§39) — Env-Configured, Mobile-Safe Position
- **Type**: `rule`
- **Given**: `NEXT_PUBLIC_WHATSAPP_NUMBER=15551234567` env set; and on checkout page 390px mobile viewport.
- **When**: Desktop + mobile render; click floating button.
- **Then**: Desktop bottom-right button "💬 Chat with us" links to `wa.me/15551234567`. Mobile: bottom-right with enough y-offset that checkout primary CTA "Pay Now" / "PROCEED TO CHECKOUT" / sticky summary remain clickable (no overlap overlap overlap). No fake number hardcoded anywhere.
- **Pass Condition**: Links to env-configured number; checkout page snapshot shows no overlap on 390px. Grep `2340000000000` (old fake Nigeria #) → 0 matches in src/.
- **Evidence**: Desktop/mobile screenshots; grep.

### AC-25: Animation System Standards (§40–43) — Motion Tokens, prefers-reduced-motion, Page Transitions <250ms
- **Type**: `rule`
- **Given**: Browser DevTools Rendering → Emulate CSS media feature prefers-reduced-motion: reduce.
- **When**: Navigate between pages; hover category/product cards; open drawer/search; add-to-cart; remove cart item.
- **Then**: Motion tokens single-sourced (globals.css @theme: duration/ease constants). With prefers-reduced-motion on: ALL non-essential animations DISABLED (no hover zoom, no fade transitions, no entrance fades; keep essential state focus rings). Page transitions <250ms and feel fast (no perceptible delay blocking shopping). Product hover spec exact: img scale(1.04) (§41), button slight up, wishlist scale, price static; category arrow 3–5px (§42).
- **Pass Condition**: prefers-reduced-motion disables decorative; page transition <250ms; spec exact transforms match.
- **Evidence**: DevTools reduced-motion capture; transform rule screenshots.

### AC-26 (NEW §35): Homepage Section Order = 18 Exactly. Visual Rhythm Alternate Light/Ivory/Editorial Bgs.
- **Type**: `rule`
- **Given**: Home DOM.
- **When**: Enumerate section data-testid or section h2 ids.
- **Then**: 18 sections exactly in order per AC-4 list. Background classes alternate pattern: ivy/cream/white/ivory/editorial-dark-green or similar — no 4 consecutive identical bg.
- **Pass Condition**: Id list matches 18; background pattern inspection.
- **Evidence**: Annotated DOM screenshot.

### AC-27 (NEW §36): How It Works 4-Step Section with Icons + Subtle Reveal Animations
- **Type**: `rule`
- **Given**: Home section "Giving is easy."
- **When**: Read.
- **Then**: 4 steps numbered 01–04: Choose something they'll love; Add their details and your message; Choose an available delivery option; Track your order until it arrives. Icons for each step. Reveal on scroll (IntersectionObserver) with fade + 8px translate.
- **Pass Condition**: Exact copy; 4 icons; scroll-reveal functional.
- **Evidence**: Screenshot + IntersectionObserver code reference.

### AC-28 (NEW §43): Page Transitions Feel Fast — <250ms, No Sluggishness
- **Type**: `rubric`
- **Dimension**: Perceived performance on route transitions.
- **Scale**: 1-5
- **Anchors**: 1 = >500ms or jarring hard-cut; 3 = fade 300-400ms acceptable; 5 = subtle fade/slide <250ms, instant-feeling, no blocking of cart actions; prefers-reduced-motion disables entirely.
- **Pass Threshold**: >= 4
- **Evidence**: 3 transitions timed with DevTools Performance panel; screenshot of Performance trace.

---

*End of updated spec. Includes full integration of original §1–27 plus §28–43 prompt additions.*
