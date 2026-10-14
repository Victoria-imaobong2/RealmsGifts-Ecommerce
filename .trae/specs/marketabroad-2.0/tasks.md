# Market Abroad 2.0 — Implementation Plan (Updated with §28–43: 42 Tasks, 28 ACs)

## Task 1: Foundation — Design Tokens & Palette + Motion System (globals.css Tailwind v4 @theme)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Rewrite `src/app/globals.css` using Tailwind v4 `@theme inline {}` block with all brand tokens + motion system:
    - Colors (9 brand tokens per AC-1), radius, shadow, spacing, letter-spacing.
    - **Motion tokens**: durations `150ms` (fast), `200ms` (standard), `250ms` (standard), `300ms` (slow). Easings: `ease-out` (enter), `ease-in` (exit).
    - Decorative animations (entrance, category/product hover, scroll-reveal, toasts) class sets gated on `@media (prefers-reduced-motion: no-preference)`.
    - Font-family CSS vars `--font-playfair` + `--font-inter` wired from next/font/google in Task 2.
    - Selection bg forest/ivory.
    - Focus-visible outline `2px solid` gold token.
    - Restyle marquee to brand.
- **Acceptance Criteria Addressed**: AC-1, AC-25
- **Test Requirements**:
  - `rule` TR-1.1: globals.css imports tailwindcss; contains `@theme inline`; 9 brand color tokens present; motion duration tokens (150/200/250/300ms) present.
  - `rubric` TR-1.2: Dimension token coverage; scale 1-5; anchors 1 = basic palette only; 3 = colors+radius; 5 = palette/radius/shadow/motion/fontvars complete + organized; threshold >= 4.
  - `rule` TR-1.3: prefers-reduced-motion media query gate present for decorative keyframes.

---

## Task 2: Foundation — Fonts, Metadata, Viewport Export (layout.tsx)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - `src/app/layout.tsx`: import Playfair_Display + Inter next/font/google.
  - Export separate `viewport` object (width, initialScale, themeColor #173F35). Remove inline metadata.themeColor.
  - Rewrite metadata: title "Market Abroad — Thoughtful gifts. Wherever they are."; description; metadataBase; OG/Twitter.
  - `<body>` className: font-sans + antialiased + bg warm-ivory.
- **Acceptance Criteria Addressed**: AC-1, AC-14
- **Test Requirements**:
  - `rule` TR-2.1: Fresh-tab browser console shows zero themeColor-deprecation warning.
  - `rule` TR-2.2: GetDiagnostics 0 errors on layout.tsx; Playfair + Inter both loaded; 2 exports (metadata + viewport).

---

## Task 3: Foundation — USD Formatter + Catalogue Loader (dual-path) + Destinations + Delivery Tiers + Shared IA Arrays
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - `src/lib/format.ts` → `formatUSD(n)` via Intl.NumberFormat en-US currency USD.
  - `src/lib/catalogue.ts`: typed CatalogProduct; FALLBACK_PRODUCTS; getProducts(params)/getProductById dual path DB + fallback.
  - `src/lib/destinations.ts`: DESTINATIONS array (USA default first; Canada, UK, Nigeria, Ghana, Kenya).
  - **NEW §28**: `src/lib/delivery-tiers.ts` → DELIVERY_TIERS: Standard, Express, Same-Day, Scheduled. Per-destination availability, prices in USD, window strings, restrictions. isTierAvailable(product, dest) helper. Builds real est arrival date via Date arithmetic.
  - `src/lib/ia.ts`: Categories(18), Occasions(18), Recipients(11), Budgets(5), TrustFeatures(6), HowItWorksSteps(4), DeliveryHighlights(4) — single source.
- **Acceptance Criteria Addressed**: AC-2, AC-10, AC-16
- **Test Requirements**:
  - `rule` TR-3.1: formatUSD(49.99) returns `$49.99`; formatUSD(1000) includes `,` separator.
  - `rule` TR-3.2: DESTINATIONS[0].country === "United States". DELIVERY_TIERS includes 4 named tiers. ia.ts exports match exact counts.
  - `rule` TR-3.3: isTierAvailable returns false for Same-Day on Nigeria destination sample (per seed config — never invent).

---

## Task 4: Core Data — Prisma Schema Additive + Validation (AC-12 Expanded)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - Edit `prisma/schema.prisma` additive-only. Product gains: sku, category, subcategory, occasions[], recipients[], currency USD default, description, longDescription, materials[], dimensions, weight, ingredients, careInstructions, personalizable, giftWrapAvailable, destinationAvailability[], relatedProductIds[], ratingAvg (Decimal), ratingCount Int.
  - **NEW forward-compat models** (additive, FK to User nullable for future): `WishlistItem`, `SavedRecipient` (nickname, name, phone, address), `SavedAddress`, `Review` (rating/body/customer/product/date), `GiftBundle`, `Order.verificationToken String?` for Track Order secure gate, `Order.deliveryTier String?` + `Order.deliveryEstimate DateTime?`.
  - OrderStatus enum retains PENDING/PAID/DISPATCHED/DELIVERED unchanged.
  - Run prisma validate; prisma format.
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `rule` TR-4.1: `npx --yes pnpm@11.0.8 exec prisma validate` exit 0.
  - `rule` TR-4.2: additive-only diff; no `-` lines in schema (except whitespace/comments); 5 new models documented above exist.

---

## Task 5: Core Data — 40–60 Seed Products (USD Across 18 Categories) + FALLBACK_PRODUCTS Sync
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - Rewrite `prisma/seed.ts`: 40–60 products, USD prices 24.99–249.99, 18 categories covered, African&Nigerian Favorites ≤ 15%. All images matched to category type (flowers→flowers, cake→cake, watch→watch etc.). Populate occasions/recipients arrays. 3–6 variants per applicable category. SKU set.
  - Sync FALLBACK_PRODUCTS in catalogue.ts with identical seed content.
- **Acceptance Criteria Addressed**: AC-2, AC-15
- **Test Requirements**:
  - `rule` TR-5.1: seed ≥40 prices; 0 currency NGN; category count ≥18.
  - `rubric` TR-5.2: Dimension image-category-match; scale 1-5; anchors 1 mismatches common; 3 few mismatches; 5 zero mismatches evenly distributed; threshold >= 4.

---

## Task 6: State — Zustand Cart Single-Source Fix + Persist + Cart Animations State + Companion Wishlist Store + Saved Recipients Store
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - `useCartStore.ts`: add persist middleware key="cart-storage" (backward compat); ensure qty +/- fires visual animation trigger (e.g., `flashId` state used by Task 18); extend CartItem type with variant/giftOptions/personalization fields.
  - `ProductSlideCard.tsx`: DELETE L33-56 localStorage bypass → use store.addItem.
  - `useWishlistStore.ts`: Zustand store persist key="wishlist-storage"; productId[]; toggle/add/remove/has.
  - **NEW §31**: `useSavedRecipientsStore.ts`: persist key="saved-recipients"; add/edit/delete; row-level scoping on client; suggestion presets Mom/Dad/Partner/Friend/Family.
- **Acceptance Criteria Addressed**: AC-6, AC-9, AC-20, AC-25
- **Test Requirements**:
  - `rule` TR-6.1: grep `localStorage.*cart-storage.*=` src → 1 site only (middleware). ProductSlideCard no bypass.
  - `rule` TR-6.2: Click add from 3 entry points → all same count. Reload persists.
  - `rule` TR-6.3: wishlist store toggle; saved recipients adds Mom preset; all 3 stores export `persist`.

---

## Task 7: Header — Desktop Navbar Premium IA Rewrite (Links to NEW Routes: /track /account /wishlist /gift-finder /product/[id])
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 6
- **Description**:
  - Rewrite Navbar.tsx:
    - Announcement bar configurable "Thoughtful gifts. Wherever they are." ivory/forest.
    - MARKET ABROAD logo (Playfair/forest).
    - Desktop nav 8: Home, Shop(/catalog), Categories(#category-grid), Occasions(#occasions-grid), Gifts for Her, Gifts for Him, Track Order(/track), About(/about — create simple stub page).
    - Right rail: Search (opens Task-25 overlay `/search` or inline overlay), Wishlist heart icon + badge live count → `/wishlist`, Account → `/account` or `/login`, Cart icon + badge live count → `/cart`.
  - DeliveryBanner.tsx: replace with destination-contextual premium tagline; fallback to brand slogan.
  - BottomNav.tsx: return null (O5 default; keep code).
- **Acceptance Criteria Addressed**: AC-3, AC-11
- **Test Requirements**:
  - `rule` TR-7.1: Desktop 8 nav links all `<a>` with real hrefs; right-rail 4 icons with hrefs; badges reflect Zustand stores.
  - `rule` TR-7.2: focus outline gold visible on tab. Body contrast passes AA ≥4.5.

---

## Task 8: Header — Accessible Mobile Drawer (Mobile-Safe; §53 FR-3)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 7
- **Description**:
  - `MobileDrawer.tsx`: left slide (CSS transforms 250ms ease-out). Links: Shop, Categories, Occasions, Gifts for Her, Gifts for Him, Track Order, About, Contact.
  - Close methods: ×, backdrop, Escape key. Focus trap, scroll lock, focus restore on close.
  - Wire into Navbar for md:hidden.
- **Acceptance Criteria Addressed**: AC-3, AC-11, AC-25
- **Test Requirements**:
  - `rule` TR-8.1: Open drawer → body overflow hidden; Escape/backdrop/× close; focus returned to trigger button.
  - `rubric` TR-8.2: Dimension drawer-a11y; scale 1-5; anchors 1 no focus mgmt; 3 basic close; 5 3-methods + trap + lock + restore; threshold >= 4.
  - `rule` TR-8.3: prefers-reduced-motion reduce disables transform animation (keeps visibility instant).

---

## Task 9: Homepage Sections 1–3 — Announcement Bar (§35), Header, Hero, International Gifting, Destination Selector
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3, Task 7
- **Description**:
  - Rewrite `/app/page.tsx` sections 1,2,3,4,5 per §35 order (starting at 3 really since announcement+header are layout children):
    - Hero split layout; CTA SHOP GIFTS → /catalog, SHOP BY OCCASION → #occasions-grid.
    - "Wherever they are, make the moment count" + destination chips.
    - Destination selector Country/City/ZIP — USA default.
  - Use catalogue loader DB-safe pattern.
- **Acceptance Criteria Addressed**: AC-4, AC-10, AC-26
- **Test Requirements**:
  - `rule` TR-9.1: Home HTTP 200 no DB; hero headline; 2 CTAs + 4+ destination chips; USA default selected.
  - `rule` TR-9.2: Home sections 1-5 section order ids match §35 start (Announcement bar → Header → Hero → International Gifting → Destination Selector).

---

## Task 10: Homepage Sections 6–7 — Delivery Highlights + 18 Category Cards (§35, §42 Animations)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 9
- **Description**:
  - Section 6 Delivery Highlights: 4-column strip Standard/Express/Same-Day/Scheduled icons + short copy; link /#delivery-options anchor.
  - Section 7 "Find something they'll love." 18 CategoryCard.tsx grid. Card: image scale(1.03–1.06) on hover, shadow lift, **arrow 3–5px translate**, title subtle transition (opacity+translateY-2px), 200–300ms total. Mobile horizontal carousel or 2-col. Each links `/catalog?category=X`.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-25, AC-26
- **Test Requirements**:
  - `rule` TR-10.1: 18 cards with valid category URLs.
  - `rubric` TR-10.2: Dimension hover-animation-quality; scale 1-5; anchors 1 none; 3 basic zoom; 5 image zoom + shadow + arrow 3-5px + title subtle; threshold >= 4.

---

## Task 11: Homepage Sections 8–11 — Shop by Occasion (18), Featured Products, Gift Bundles, Shop by Recipient (11)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 10
- **Description**:
  - Section 8 Occasions 18 cards → /catalog?occasion=X.
  - Section 9 Featured Products 8–12 via catalogue loader with Task-14 product cards (wishlist/add-to-cart animations included).
  - Section 10 Gift Bundles: 6 bundle cards (Birthday/Self-Care/Anniversary/For Him/For Her/Long-Distance Love); list included products, savings (if any), destination, personalize CTA.
  - Section 11 Recipients 11 cards → /catalog?recipient=X.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-26
- **Test Requirements**:
  - `rule` TR-11.1: counts = 18 occasions, 11 recipients, 6 bundles, ≥8 featured.
  - `rule` TR-11.2: featured product cards use Task-14 component (reuse, no duplicate).

---

## Task 12: Homepage Sections 12–16 — Shop by Budget (5), Gift Finder CTA, How It Works, Why Market Abroad (Genuine Only), Customer Reviews Coming-Soon
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 11
- **Description**:
  - Section 12 Budget 5 cards → /catalog?min=&max= URLs.
  - Section 13 Gift Finder inline "Not sure what to get?" CTA button → /gift-finder + quiz teaser (3 steps Who? Occasion? Budget?).
  - Section 14 How It Works "Giving is easy." 01–04 numbered steps per §36 exact copy; icons; IntersectionObserver reveal-on-scroll fade+translateY-8px 250ms.
  - Section 15 Why Market Abroad Trust 6 real-capabilities per §37 exact names: Secure Checkout, Clear Delivery Information, Personalized Gifting, Order Tracking, Responsive Customer Support, Carefully Curated Products. No fake stats.
  - Section 16 Customer Reviews: "Customer reviews coming soon." styled placeholder per O8 default (not hidden; show 1 elegant block).
- **Acceptance Criteria Addressed**: AC-4, AC-22, AC-23, AC-26, AC-27
- **Test Requirements**:
  - `rule` TR-12.1: Budget card URLs valid min/max numeric params; How It Works exact step copy; Trust 6 capabilities exact text.
  - `rule` TR-12.2: Grep home for regexp `\d+\+?\s*(customer|countr|order|review|star|rating)` → 0 matches; reviews shows "coming soon" exact wording; no fake names.
  - `rule` TR-12.3: Scroll past How It Works → IntersectionObserver fires reveal (snapshot show revealed).

---

## Task 13: Homepage Sections 17–18 — Newsletter + Footer. Visual Rhythm Background Alternation.
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 12
- **Description**:
  - Section 17 Newsletter: per O2 default → disabled submit "Coming soon"; no network.
  - Section 18 Footer: logo, shop/categories/occasions links, Track Order, WhatsApp callout, copyright.
  - **Visual rhythm**: Across all 18 sections assign bg ivory/white/cream/forest-dark-editorial so no 4 same consecutive; document pattern in code comments.
- **Acceptance Criteria Addressed**: AC-4, AC-26
- **Test Requirements**:
  - `rule` TR-13.1: Newsletter submit click no network request; footer renders sections.
  - `rule` TR-13.2: 18 sections enumerated all present. No 4 consecutive identical bg.

---

## Task 14: Catalogue ProductCard Component Premium — Wishlist + Add-to-Cart (§41 Animations)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 6
- **Description**:
  - `src/components/ProductCard.tsx`: image, wishlist heart scale fill animation 150ms, name, category, formatUSD price, previous price strike only genuine discount, availability badge, delivery estimate (via delivery-tiers helper), Add to Cart or Choose Options.
  - Animations exact per §41: hover image scale(1.04) 200ms ease-out; CTA translateY -2px on hover; **wishlist heart subtle 1.1 scale feedback on tap/click**; price NO animation; Add to Cart button → store update IMMEDIATE then loading spinner 300ms → "Added to cart ✓" tick + ARIA-live toast.
  - No page reload; Zustand store; prefer-reduced-motion disables decorative keeps focus.
- **Acceptance Criteria Addressed**: AC-2, AC-6, AC-20, AC-25
- **Test Requirements**:
  - `rule` TR-14.1: price format `$X.XX`; 0 ₦.
  - `rule` TR-14.2: click heart → store; reload persists. click Add → button state: idle→spinner→tick; cart badge count live.
  - `rule` TR-14.3: DevTools hover → computed transform: scale(1.04) on img; no transform on price span.

---

## Task 15: Catalogue Page — Filter/Sort State Machine URL-Synced + Pagination
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 5, Task 14
- **Description**:
  - Rewrite `/catalog/CatalogClient.tsx`: sync state ↔ URL searchParams shallow; filters Category, Occasion, Recipient, Price range, Availability, Delivery Destination. Sort Featured / Newest / Price LoHi / Price HiLo.
  - Server page uses catalogue loader; DB-safe.
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-15.1: Category change → ?category=Flowers → list filtered; sort Lo→Hi ascending correct.
  - `rule` TR-15.2: Back button restores state; page reload applies URL params.

---

## Task 16: PDP — Route + Gallery + Variants + Personalization + Related + Delivery Tiers Block
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 5, Task 6, Task 14
- **Description**:
  - Create `/product/[id]/page.tsx` server + client component.
  - Gallery main + thumb click update.
  - Info: title, rating if present, formatUSD price, desc, variants size/color picker, qty selector, **4-tier delivery block per AC-16** (est arrival, price USD, window, restrictions; unavailable same-day message exact), personalization (gift wrap, recipient name/phone, message, sender, hide-price, delivery date, instructions), wishlist heart, Add to Cart + Buy Now.
  - Tabs: Description / Details / Delivery / Returns / Reviews placeholder / Related Products.
  - DB-safe dual path; no errors without DB.
- **Acceptance Criteria Addressed**: AC-7, AC-10, AC-16
- **Test Requirements**:
  - `rule` TR-16.1: `/product/{fallback}` HTTP 200 no DB; gallery; variants; personalization 6+ fields.
  - `rule` TR-16.2: Destination unavailable same-day → renders exact string: "Same-day delivery isn't available for this item or destination." (case-insensitive substring match)

---

## Task 17: Cart Page Improvements — Full Column Set + Subtotal/Shipping/Tax/Total + Save for Later
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 6
- **Description**:
  - Rewrite `/cart/page.tsx`. Items list columns: image, name, variant, qty +/-, unit price, line total, gift options chip (if personalization set), Remove button, Save for Later button (Save-for-Later label "Saved" OK for v2.0 without backend).
  - Summary: Subtotal, **Estimated Shipping** (DESTINATIONS default USA), **Taxes** (rudimentary % estimator), **Total** — all formatUSD.
  - CTA PROCEED TO CHECKOUT. No page reload on any mutation.
- **Acceptance Criteria Addressed**: AC-2, AC-8, AC-18
- **Test Requirements**:
  - `rule` TR-17.1: all 8 columns; all 4 summary USD lines. 0 ₦.
  - `rule` TR-17.2: all +/-/remove actions complete without window.location change.

---

## Task 18: Cart Animations — Qty Change Flash + Remove Fade/Slide-Up + Item Add Toast. Subtle.
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 17
- **Description**:
  - Wire animation feedback per §30 & §40. Qty +/- → row bg flash gold/ivory 150ms. Remove → 250ms fade-out + translateY -8px + height collapse. Added item → ARIA-live "Added to cart ✓" tick toast.
  - All gated prefers-reduced-motion.
- **Acceptance Criteria Addressed**: AC-18, AC-25
- **Test Requirements**:
  - `rubric` TR-18.1: Dimension cart-animation subtlety; scale 1-5; anchors 1 jarring; 3 visible but some too loud; 5 flash 150ms fade slide 250ms no bounce; threshold >= 4.

---

## Task 19: Checkout — USA-first Address Form + Delivery Tier Chooser (§28) + Est Sales Tax
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 17
- **Description**:
  - Rewrite `/checkout/page.tsx`. Delete Nigeria-only LOCATIONS; use DESTINATIONS.
  - USA default: First/Last, Email, Phone, Street, Apt/Suite/Unit, City, State (50 state dropdown + DC + territories), ZIP. Fields adapt when non-USA selected.
  - **NEW §28**: "Choose your delivery" 4 radio-tiers (Standard/Express/Same-Day/Scheduled). Only show tiers where isTierAvailable()=true. Display for each: Est arrival, USD price, window, restrictions. Unavailable same-day → exact copy.
  - Summary: Subtotal/Shipping/Discount/Est Sales Tax/Total USD.
- **Acceptance Criteria Addressed**: AC-2, AC-8, AC-16
- **Test Requirements**:
  - `rule` TR-19.1: State dropdown count ≥ 50; ZIP input; form required-field validation errors visible.
  - `rule` TR-19.2: 4 tiers radio; unavailable tier disabled + exact unavailable copy if Same-Day; summary 4 USD lines.

---

## Task 20: Paystack — Initialize USD Cents + currency:USD + Order deliveryTier. Webhook email USD.
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 19
- **Description**:
  - `/api/paystack/initialize/route.ts`: body amount × 100 cents; add explicit `currency: "USD"`. Persist selected deliveryTier + deliveryEstimate on Order.
  - `/api/webhook/paystack/route.ts`: HMAC check preserved identically; Resend email formatUSD amounts, no ₦.
- **Acceptance Criteria Addressed**: AC-8, AC-13
- **Test Requirements**:
  - `rule` TR-20.1: init body includes currency:"USD". signature-check code identical preserved per line comparison.
  - `rule` TR-20.2: email template references `$` not `₦`.

---

## Task 21: Track Order Page — Order Number + Email Verification Gate + 6-Step Timeline + Secure POD Photo
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4, Task 5
- **Description**:
  - Create `/track/page.tsx`: form with Order Number + Email (A7 default email-match pattern).
  - Server-side `/api/track/lookup`: verify email === stored Order.email OR verificationToken matches; if FAIL return unauthorized. If OK, return timeline data + if DELIVERED + POD exists → return POD photo URL signed/short-lived or base64 (for v2.0).
  - Timeline per §29 exactly: Order Received → Payment Confirmed → Preparing Your Gift → Ready for Delivery → Out for Delivery → Delivered. Each step highlighted ONLY if backend-recorded status ≥ that level (gray/disabled otherwise).
  - If POD photo + verified → display below timeline.
  - DB-safe: without DB render mock-friendly lookup.
- **Acceptance Criteria Addressed**: AC-17, NFR-4 Security
- **Test Requirements**:
  - `rule` TR-21.1: Scenario: wrong-email reject; right-email → 6-step timeline rendered; direct-URL-without-verify → POD hidden/blurred.
  - `rule` TR-21.2: 6 step labels match §29 exactly.

---

## Task 22: Existing Pages Theming — Login/Profile/Orders Detail/POD
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 2
- **Description**:
  - `/login`, `/profile`, `/orders/[id]`, `/delivery/pod/[id]` — apply 2.0 brand tokens; USD formatting on orders; profile My Orders list USD; tracking DISPATCHED label. POD page updated palette only logic untouched.
  - **Security gate**: `/orders/[id]` now requires either admin cookie OR email-match verification (from Task-21 same pattern) before displaying recipient info/POD.
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-17
- **Test Requirements**:
  - `rule` TR-22.1: 0 ₦ anywhere; DISPATCHED label not SHIPPED.

---

## Task 23: Admin Panel — USD Format + DISPATCHED Status + Expanded Product Fields
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - `/admin/page.tsx`: all prices formatUSD; status select "SHIPPED" → rename option to "DISPATCHED" match enum; product form extend category, subcategory, occasion, recipient, sku, currency USD default, variants, image array.
  - `/api/admin/orders/route.ts`: accept DISPATCHED; `/api/admin/products/route.ts` accept additive fields.
- **Acceptance Criteria Addressed**: AC-2, AC-12
- **Test Requirements**:
  - `rule` TR-23.1: grep admin "SHIPPED" rendered → 0; DISPATCHED present; 0 ₦.

---

## Task 24: Account Dashboard — 7 Nav Sections + My Recipients CRUD with Row-Level Scoping
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 6, Task 22
- **Description**:
  - Create `/account/page.tsx` dashboard. Side nav: My Orders, Track Order, Wishlist, Saved Addresses, Saved Recipients, Gift History, Account Settings.
  - Each nav item renders; sections without backend show Sign-in CTA or empty/coming-soon graceful state for guest v2.0 USER role.
  - **My Recipients (§31)** integrated from Task-6 useSavedRecipientsStore; add/edit/delete; suggestion chips Mom/Dad/Partner/Friend/Family. Disjoint storage isolation: guest A session can never see guest B recipients.
- **Acceptance Criteria Addressed**: AC-19
- **Test Requirements**:
  - `rule` TR-24.1: 7 nav items rendered. add Mom on session A → reload → session B storage shows 0 Mom entries.
  - `rule` TR-24.2: suggestion chips for presets exist.

---

## Task 25: Wishlist Route — /wishlist Persistent Page with Add to Cart + Remove
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 6, Task 14
- **Description**:
  - Create `/wishlist/page.tsx`. Grid of products from useWishlistStore. Card image, name, formatUSD price, availability badge, Add to Cart CTA, Remove CTA.
  - Persist across reload. Empty state "Your wishlist is empty. Explore gifts." + shop CTA.
- **Acceptance Criteria Addressed**: AC-20
- **Test Requirements**:
  - `rule` TR-25.1: 4 wishlisted items → page renders 4; reload retains; Remove works; Add to Cart from wishlist moves to cart correctly.

---

## Task 26: Search Overlay Premium — 4 Suggestion Types + Empty States + Budget/Mom/Perfume/Chocolate/Jewelry Mapping
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - Create `SearchOverlay.tsx` full-screen overlay; header search icon opens it. Input placeholder "What are you looking for?".
  - Live results 4 sections: Product suggestions (title match /description /tag), Category suggestions (Categories array fuzzy), Occasion suggestions (Occasions array fuzzy), Recipient suggestions (Recipients array fuzzy).
  - Natural term mapping: "Under $50" → budget filtered catalogue; "Birthday" → occasion; "Mom" → recipient; "Perfume", "Chocolate", "Jewelry", "Gift box" → category or tag match.
  - Empty state for zzzzz: "No results — try these top categories." chips.
  - Keyboard: Esc closes; focus traps; prefers-reduced-motion disables fade.
- **Acceptance Criteria Addressed**: AC-21
- **Test Requirements**:
  - `rule` TR-26.1: 4 suggestions sections rendered on a common query; "Under $50" navigates to min=0 max=50 catalogue; "zzzzz" yields empty UI.

---

## Task 27: Gift Finder "Help Me Choose" — 3-Step Deterministic Quiz + Curated Results
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 14
- **Description**:
  - Create `/gift-finder/page.tsx`. Step 1 "Who are you shopping for?" — 8 options Her/Him/Mom/Dad/Partner/Friend/Coworker/Family. Step 2 Occasion — Birthday/Anniversary/Graduation/Thank You/Just Because/Other. Step 3 Budget — Under $25/$25-50/$50-100/$100+.
  - Deterministic filter predicate on recipients[] ∩ occasions[] ∩ price band.
  - Label output "Curated Recommendations". Never AI-labeled.
  - Wire home section 13 CTA to /gift-finder.
- **Acceptance Criteria Addressed**: AC-22
- **Test Requirements**:
  - `rule` TR-27.1: 3 UI steps rendered with exact option labels; result card "Curated Recommendations". Grep AI-related in route → 0 "AI recommendation" phrases.
  - `rule` TR-27.2: filter predicate matches answers visually on seeded products.

---

## Task 28: WhatsApp Floating CTA — Desktop + Mobile-Safe Position + Env-Configured Number
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 7
- **Description**:
  - Create `WhatsAppFloat.tsx`: desktop fixed bottom-right "💬 Chat with us" bg-forest text-ivory; onClick `window.open("https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}", "_blank")`.
  - Mobile: bottom-right y-offset 96px above checkout sticky bottom; checkout viewport dynamically hide if scroll within 200px of Pay Now or absolutely position NOT to overlap primary CTA. Never hardcode fake number.
  - Remove old WhatsappModal fake number (234000...) or rewrite it.
- **Acceptance Criteria Addressed**: AC-24
- **Test Requirements**:
  - `rule` TR-28.1: env=15551234567 → link wa.me/15551234567. On 390px checkout snapshot (screenshot) Pay Now / PROCEED visible clickable (no overlay occlusion). grep 2340000000000 → 0 matches in src.

---

## Task 29: Page Transitions System — <250ms Subtle Fade/Slide + Suspense Fallback + prefers-reduced-motion
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 2
- **Description**:
  - Implement route transitions using Next Suspense + Tailwind transition opacity (150–200ms) OR Next router events (CSS classes). Avoid adding framer-motion unless strictly needed (per default O6).
  - Subtle fade + translateY 4px on mount. prefers-reduced-motion: disable decorative transitions entirely. Keep <250ms so shopping feels fast.
- **Acceptance Criteria Addressed**: AC-25, AC-28
- **Test Requirements**:
  - `rubric` TR-29.1: Dimension transition-speed; scale 1-5; anchors 1 >500ms lag; 3 300-400ms; 5 <250ms, smooth, instant-feel no block; threshold >= 4.

---

## Task 30: Graceful Degrade QA — All 12 Public Pages HTTP 200 No DB Zero Prisma Errors
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 9-16, 17, 19, 21, 24, 25, 27 (routes that don't exist yet)
- **Description**:
  - Unset `.env` / DATABASE_URL. GET: `/`, `/catalog`, `/cart`, `/checkout`, `/product/{fallback}`, `/profile`, `/account`, `/track`, `/wishlist`, `/gift-finder`, `/search`, `/login`, `/orders/bogus-id`, `/delivery/pod/bogus`.
  - For each page server stdout HTTP 200; stderr zero Prisma errors. All pages render useful guest/empty states.
  - Fix breakages.
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-30.1: curl list → 12×200; grep server stderr PrismaClientInitializationError → 0. Browser console clean.

---

## Task 31: WCAG 2.1 AA A11y Spot Checks — Extended to Search/Gift Finder/Drawer/Track
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 7,8,9-16,19,26,27
- **Description**:
  - Navbar/drawer keyboard focus; search overlay focus/escape; gift-finder step-through tab; checkout field labels; images alt; ARIA-live toasts for add-to-cart/wishlist; body contrast ≥4.5.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rubric` TR-31.1: wcag-aa dimension; scale 1-5; anchors 1 violations common; 3 some labels; 5 contrast+focus+alt+drawer+overlay+toast aria-live all pass; threshold >= 4.

---

## Task 32: Genuine Trust & Reviews Section — Post-Implementation Audit
- **Status**: `pending`
- **Priority**: high (business-critical no-fake rule)
- **Depends On**: Task 12 (sections 15+16)
- **Description**:
  - Post-build audit grep home + footer + about for: number of customers/countries/orders/star-ratings/partnerships/fake logistics-brand names (DHL, UPS etc.). Zero matches required.
  - Confirm reviews section: coming-soon exact text or empty; no fake names.
- **Acceptance Criteria Addressed**: AC-23
- **Test Requirements**:
  - `rule` TR-32.1: Regexp grep 0 matches across src. Home reviews section screenshot.

---

## Task 33: Build & Lint + Diagnostics Zero Errors — Final
- **Status**: `pending`
- **Priority**: high
- **Depends On**: All tasks 1–32
- **Description**:
  - `npm exec -- next lint`; `npm exec -- next build`; GetDiagnostics 0 errors; `tsc --noEmit` if available.
- **Acceptance Criteria Addressed**: Aggregate AC-1..AC-28
- **Test Requirements**:
  - `rule` TR-33.1: lint exit 0; build exit 0; GetDiagnostics 0-error count.

---

## Task 34: Review Session — Independent AC Coverage + review.md Artifact
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 33
- **Description**:
  - Walk through every AC 1→28; document pass/fail + evidence in `review.md` file under `.trae/specs/marketabroad-2.0/`. Create remediation queue for any failures.
  - Then user-visible final report.

---

---

## AC → Task Coverage Matrix (All 28 ACs Covered)

| AC | Tasks |
|----|-------|
| AC-1 Brand tokens/typography/global | 1, 2, 7, 22, 28 |
| AC-2 USD formatting everywhere | 3, 5, 14, 17, 19, 20, 22, 23 |
| AC-3 Navbar + mobile drawer | 7, 8 |
| AC-4 Home 18 sections CTAs navigate | 9, 10, 11, 12, 13 |
| AC-5 18×18×11×5 cards content+hover §42 | 10, 11, 12 |
| AC-6 Catalog filter/sort + wishlist + add-to-cart §41 | 6, 14, 15 |
| AC-7 PDP route + gallery + variants + personalization + delivery tiers | 16 |
| AC-8 USA checkout + USD summary + Sales Tax + delivery chooser | 17, 19, 20 |
| AC-9 Zustand single-source cart, localStorage bypass removed | 6 |
| AC-10 Graceful no-DB degrade all 12 public pages HTTP200 clean | 3, 9, 16, 30 |
| AC-11 WCAG 2.1 AA essentials + extended overlay/gift-finder | 7, 8, 31 |
| AC-12 Prisma additive + new forward models + DISPATCHED harmonize | 4, 23 |
| AC-13 Paystack init USD cents + currency USD + webhook preserved | 20 |
| AC-14 viewport export + new metadata + no-themeColor-deprecation | 2 |
| AC-15 40–60 realistic USD seed, correct image, 18 cats | 5 |
| AC-16 **NEW** 4-tier delivery avail, estimates, pricing, unavailable msg | 3, 16, 19 |
| AC-17 **NEW** Track order email-verify gate + 6-step timeline + secure POD | 21, 22 |
| AC-18 **NEW** Cart improvements + add/qty/remove animations | 17, 18 |
| AC-19 **NEW** Account dashboard 7 sections + My Recipients secure scoping | 24 |
| AC-20 **NEW** Wishlist heart every product + dedicated page persistent | 6, 14, 25 |
| AC-21 **NEW** Premium search overlay 4-section suggestions + empty | 26 |
| AC-22 **NEW** Gift finder 3-step deterministic curated no-AI | 27 |
| AC-23 **NEW** Genuine trust cap + genuine reviews (coming-soon) zero fabrication | 12, 32 |
| AC-24 **NEW** WhatsApp float env-configured + mobile checkout safe | 28 |
| AC-25 **NEW** Motion system tokens + prefers-reduced-motion + exact transforms (§40-42) | 1, 6, 8, 10, 14, 18, 25, 26, 29 |
| AC-26 **NEW** Home 18 sections §35 correct order visual rhythm | 9, 10, 11, 12, 13 |
| AC-27 **NEW** How it works 4-steps icons + scroll-reveal I.O. | 12 |
| AC-28 **NEW** Page transitions <250ms fast (rubric) | 29 |
