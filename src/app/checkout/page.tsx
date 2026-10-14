"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, Gift, Lock, ShoppingBag } from "lucide-react";
import {
  DELIVERY_RATES_CONFIRMED,
  DESTINATIONS,
  GIFT_WRAP_FEE,
  earliestScheduledDate,
  estimateArrival,
  getDestination,
  getMethodAvailability,
  type DeliveryMethodId,
} from "@/config/delivery";
import { cn } from "@/lib/cn";
import { formatDateRange, formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { computeTotals } from "@/lib/pricing";
import { isValidPhone, isValidUsZip } from "@/lib/validation";
import { cartSubtotal, useCartStore } from "@/store/useCartStore";
import { useDestinationStore } from "@/store/useDestinationStore";
import { SafeImage } from "@/components/product/SafeImage";
import { ButtonLink } from "@/components/ui/Button";
import { Alert, EmptyState, Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";

interface SavedRecipient {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  country: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
}

type Errors = Partial<Record<string, string>>;

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 sm:p-8">
      <h2 className="flex items-center gap-3 text-2xl text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest font-sans text-sm font-semibold text-ivory">{step}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const destinationPrefs = useDestinationStore();

  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState({ fullName: "", phone: "" });
  // Idempotency key: reused if the same order is submitted twice, renewed when anything changes.
  const checkoutKeyRef = useRef<{ key: string; payload: string } | null>(null);
  const [country, setCountry] = useState("US");
  const [address, setAddress] = useState({ firstName: "", lastName: "", phone: "", line1: "", line2: "", city: "", region: "", postalCode: "" });
  const [methodId, setMethodId] = useState<DeliveryMethodId | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [gift, setGift] = useState({ message: "", senderName: "", hidePrice: true, wrap: false, instructions: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SavedRecipient[]>([]);
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const prefilled = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Prefill from the destination chosen on the home page, and the signed-in account.
  useEffect(() => {
    if (!hydrated || prefilled.current) return;
    prefilled.current = true;
    const preferred = getDestination(destinationPrefs.country);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration of browser-only preferences */
    if (preferred?.status === "available") {
      setCountry(preferred.code);
      setAddress((a) => ({ ...a, region: destinationPrefs.region, postalCode: destinationPrefs.postalCode, city: destinationPrefs.city }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) return;
        setAccount(user);
        setEmail((current) => current || user.email);
        const res = await fetch("/api/recipients");
        if (res.ok) setSaved((await res.json()).recipients ?? []);
      })
      .catch(() => undefined);
  }, [hydrated, destinationPrefs]);

  const destination = getDestination(country)!;
  const availability = useMemo(
    () => getMethodAvailability(country, address.region || undefined, items),
    [country, address.region, items],
  );
  const selected = availability.find((a) => a.method.id === methodId && a.available);
  const subtotal = cartSubtotal(items);
  const totals = computeTotals(subtotal, selected?.method.price ?? 0, gift.wrap);

  const setField = (key: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress((a) => ({ ...a, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const applySaved = (id: string) => {
    const r = saved.find((s) => s.id === id);
    if (!r) return;
    if (getDestination(r.country)?.status === "available") setCountry(r.country);
    setAddress({
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone ?? "",
      line1: r.line1,
      line2: r.line2 ?? "",
      city: r.city,
      region: r.region ?? "",
      postalCode: r.postalCode ?? "",
    });
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (customer.fullName.trim().length < 2) e.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (!isValidPhone(customer.phone)) e.customerPhone = "Enter a phone number we can reach you on.";
    if (!address.firstName.trim()) e.firstName = "Enter the recipient's first name.";
    if (!address.lastName.trim()) e.lastName = "Enter the recipient's last name.";
    if (!isValidPhone(address.phone)) e.phone = "Enter a phone number so the courier can reach them.";
    if (!address.line1.trim()) e.line1 = "Enter a street address.";
    if (!address.city.trim()) e.city = "Enter a city.";
    if (destination.regions && !address.region) e.region = `Choose a ${destination.regionLabel.toLowerCase()}.`;
    if (country === "US" && !isValidUsZip(address.postalCode)) e.postalCode = "Enter a 5-digit ZIP code.";
    if (!selected) e.method = "Choose a delivery option.";
    if (selected?.method.id === "scheduled" && (!deliveryDate || deliveryDate < earliestScheduledDate(selected.method))) {
      e.deliveryDate = "Choose an available delivery date.";
    }
    return e;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError("");
    const found = validate();
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`co-${firstInvalid}`)?.focus();
      return;
    }
    setSubmitting(true);
    const order = {
      email: email.trim(),
      customer,
      destination: country,
      address,
      deliveryMethod: methodId,
      deliveryDate: methodId === "scheduled" ? deliveryDate : undefined,
      gift,
      items: items.map((item) => ({ slug: item.slug, quantity: item.quantity, options: item.options, personalization: item.personalization })),
    };
    const payload = JSON.stringify(order);
    if (checkoutKeyRef.current?.payload !== payload) checkoutKeyRef.current = { key: crypto.randomUUID(), payload };
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutKey: checkoutKeyRef.current.key, ...order }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authorization_url) {
        // Keep the button disabled while the browser leaves for Paystack Checkout.
        window.location.assign(data.authorization_url);
        return;
      }
      setServerError(data.error || "We couldn't start your payment. Please try again.");
    } catch {
      setServerError("We couldn't reach our servers. Please check your connection and try again — you won't be charged twice.");
    }
    setSubmitting(false);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  if (!hydrated) {
    return (
      <div className="container-page py-12">
        <Skeleton className="h-10 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Add a gift to your bag to check out." action={<ButtonLink href="/shop">Shop gifts</ButtonLink>} />
      </div>
    );
  }

  const err = (key: string) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `co-${key}-error` } : {});

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest">
        <ArrowLeft size={16} aria-hidden /> Back to bag
      </Link>
      <h1 className="mt-4 text-4xl text-ink">Checkout</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
        <div className="space-y-6">
          <Section step={1} title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="co-fullName" error={errors.fullName} className="sm:col-span-2">
                <Input id="co-fullName" autoComplete="name" maxLength={120} value={customer.fullName} onChange={(e) => { setCustomer((c) => ({ ...c, fullName: e.target.value })); setErrors((x) => ({ ...x, fullName: undefined })); }} {...err("fullName")} />
              </Field>
              <Field label="Email" htmlFor="co-email" error={errors.email} hint="We'll send your receipt and tracking details here.">
                <Input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} {...err("email")} />
              </Field>
              <Field label="Phone" htmlFor="co-customerPhone" error={errors.customerPhone} hint="In case we need to reach you about your order.">
                <Input id="co-customerPhone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" value={customer.phone} onChange={(e) => { setCustomer((c) => ({ ...c, phone: e.target.value })); setErrors((x) => ({ ...x, customerPhone: undefined })); }} {...err("customerPhone")} />
              </Field>
            </div>
            {!account && (
              <p className="mt-3 text-sm text-muted">
                Have an account? <Link href="/login?redirect=/checkout" className="font-medium text-forest hover:underline">Sign in</Link> to use saved recipients.
              </p>
            )}
          </Section>

          <Section step={2} title="Who's it for?">
            {saved.length > 0 && (
              <Field label="Saved recipients" htmlFor="co-saved" className="mb-5">
                <Select id="co-saved" defaultValue="" onChange={(e) => applySaved(e.target.value)}>
                  <option value="">Choose a saved recipient…</option>
                  {saved.map((r) => (
                    <option key={r.id} value={r.id}>{r.nickname} — {r.firstName} {r.lastName}</option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country" htmlFor="co-country" className="sm:col-span-2">
                <Select id="co-country" autoComplete="country" value={country} onChange={(e) => { setCountry(e.target.value); setAddress((a) => ({ ...a, region: "", postalCode: "" })); setMethodId(""); }}>
                  {DESTINATIONS.map((d) => (
                    <option key={d.code} value={d.code} disabled={d.status !== "available"}>
                      {d.name}{d.status !== "available" ? " — coming soon" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="First name" htmlFor="co-firstName" error={errors.firstName}>
                <Input id="co-firstName" autoComplete="shipping given-name" value={address.firstName} onChange={setField("firstName")} {...err("firstName")} />
              </Field>
              <Field label="Last name" htmlFor="co-lastName" error={errors.lastName}>
                <Input id="co-lastName" autoComplete="shipping family-name" value={address.lastName} onChange={setField("lastName")} {...err("lastName")} />
              </Field>
              <Field label="Recipient's phone" htmlFor="co-phone" error={errors.phone} hint="Only used to coordinate delivery." className="sm:col-span-2">
                <Input id="co-phone" type="tel" autoComplete="shipping tel" placeholder={country === "US" ? "(555) 123-4567" : "+44 20 7946 0958"} value={address.phone} onChange={setField("phone")} {...err("phone")} />
              </Field>
              <Field label="Street address" htmlFor="co-line1" error={errors.line1} className="sm:col-span-2">
                <Input id="co-line1" autoComplete="shipping address-line1" value={address.line1} onChange={setField("line1")} {...err("line1")} />
              </Field>
              <Field label={country === "US" ? "Apartment / Suite / Unit" : "Apartment, building or landmark"} htmlFor="co-line2" optional className="sm:col-span-2">
                <Input id="co-line2" autoComplete="shipping address-line2" value={address.line2} onChange={setField("line2")} />
              </Field>
              <Field label="City" htmlFor="co-city" error={errors.city}>
                <Input id="co-city" autoComplete="shipping address-level2" value={address.city} onChange={setField("city")} {...err("city")} />
              </Field>
              {destination.regions && (
                <Field label={destination.regionLabel} htmlFor="co-region" error={errors.region}>
                  <Select id="co-region" autoComplete="shipping address-level1" value={address.region} onChange={(e) => { setField("region")(e); setMethodId((m) => (m === "same-day" ? "" : m)); }} {...err("region")}>
                    <option value="">Select…</option>
                    {destination.regions.map((r) => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label={destination.postalLabel} htmlFor="co-postalCode" error={errors.postalCode} optional={!destination.postalRequired}>
                <Input id="co-postalCode" autoComplete="shipping postal-code" inputMode={country === "US" ? "numeric" : "text"} maxLength={10} value={address.postalCode} onChange={setField("postalCode")} {...err("postalCode")} />
              </Field>
            </div>
          </Section>

          <Section step={3} title="Choose your delivery">
            <fieldset aria-describedby={errors.method ? "co-method-error" : undefined}>
              <legend className="sr-only">Delivery options</legend>
              <div className="space-y-3">
                {availability.map(({ method, available, reason }, index) => {
                  const { earliest, latest } = estimateArrival(method);
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex cursor-pointer gap-4 rounded-2xl border p-4 transition",
                        !available && "cursor-not-allowed bg-cream/40 opacity-70",
                        methodId === method.id && available ? "border-forest ring-1 ring-forest" : "border-line hover:border-forest/50",
                      )}
                    >
                      <input
                        id={index === 0 ? "co-method" : undefined}
                        type="radio"
                        name="delivery"
                        value={method.id}
                        disabled={!available}
                        checked={methodId === method.id}
                        onChange={() => { setMethodId(method.id); setErrors((x) => ({ ...x, method: undefined })); }}
                        className="mt-1 h-4 w-4 accent-[var(--color-forest)]"
                      />
                      <span className="flex-1 text-sm">
                        <span className="flex flex-wrap justify-between gap-2 font-medium text-ink">
                          {method.label}
                          <span>{formatMoney(method.price)}</span>
                        </span>
                        <span className="mt-0.5 block text-muted">
                          {!available
                            ? reason
                            : method.id === "scheduled"
                              ? "Pick the day it arrives."
                              : method.id === "same-day"
                                ? "Arrives today."
                                : `Estimated arrival ${formatDateRange(earliest, latest)}`}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.method && <p id="co-method-error" className="mt-2 text-xs font-medium text-sale">{errors.method}</p>}
            </fieldset>
            {selected?.method.id === "scheduled" && (
              <Field label="Delivery date" htmlFor="co-deliveryDate" error={errors.deliveryDate} className="mt-5 max-w-xs">
                <div className="relative">
                  <CalendarClock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                  <Input id="co-deliveryDate" type="date" className="pl-11" min={earliestScheduledDate(selected.method)} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} {...err("deliveryDate")} />
                </div>
              </Field>
            )}
            {!DELIVERY_RATES_CONFIRMED && (
              <p className="mt-4 text-xs text-muted">Delivery dates are estimates. We&apos;ll confirm the date by email after you order.</p>
            )}
          </Section>

          <Section step={4} title="Make it personal">
            <div className="space-y-4">
              <Field label="Gift message" htmlFor="co-message" optional hint={`${gift.message.length}/300 — printed on a card with the gift.`}>
                <Textarea id="co-message" maxLength={300} value={gift.message} onChange={(e) => setGift((g) => ({ ...g, message: e.target.value }))} placeholder="Happy birthday! Wish I could be there to celebrate with you." />
              </Field>
              <Field label="From" htmlFor="co-sender" optional hint="How your name appears on the card.">
                <Input id="co-sender" autoComplete="name" maxLength={80} value={gift.senderName} onChange={(e) => setGift((g) => ({ ...g, senderName: e.target.value }))} placeholder="With love, Chioma" />
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 text-sm">
                <input type="checkbox" checked={gift.wrap} onChange={(e) => setGift((g) => ({ ...g, wrap: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-[var(--color-forest)]" />
                <span>
                  <span className="flex items-center gap-2 font-medium text-ink"><Gift size={16} className="text-forest" aria-hidden /> Add gift wrapping (+{formatMoney(GIFT_WRAP_FEE)})</span>
                  <span className="mt-0.5 block text-muted">Signature wrapping with ribbon.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 text-sm">
                <input type="checkbox" checked={gift.hidePrice} onChange={(e) => setGift((g) => ({ ...g, hidePrice: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-[var(--color-forest)]" />
                <span>
                  <span className="font-medium text-ink">Hide prices from the recipient</span>
                  <span className="mt-0.5 block text-muted">No receipt or prices are included in the package.</span>
                </span>
              </label>
              <Field label="Delivery instructions" htmlFor="co-instructions" optional>
                <Textarea id="co-instructions" className="min-h-20" maxLength={300} value={gift.instructions} onChange={(e) => setGift((g) => ({ ...g, instructions: e.target.value }))} placeholder="Gate code, best time to deliver, leave with the front desk…" />
              </Field>
            </div>
          </Section>
        </div>

        <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-36">
          <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-2xl text-ink">Order summary</h2>
            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3">
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {item.image && <SafeImage src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-bold text-ivory">{item.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium text-ink">{item.name}</span>
                    {Object.values(item.options).length > 0 && <span className="block text-xs text-muted">{Object.values(item.options).join(" · ")}</span>}
                  </span>
                  <span className="text-sm font-medium text-ink">{formatMoney(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-ink">{formatMoney(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="text-ink">{selected ? formatMoney(totals.shipping) : "Select delivery"}</dd></div>
              {gift.wrap && <div className="flex justify-between"><dt className="text-muted">Gift wrapping</dt><dd className="text-ink">{formatMoney(totals.giftWrap)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd className="text-ink">—</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Sales tax</dt><dd className="text-muted">Not calculated</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt className="text-ink">Total</dt><dd className="text-ink">{formatMoney(totals.total)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted">All prices in USD. Sales tax isn&apos;t currently calculated or charged on orders.</p>

            {serverError && (
              <div ref={errorRef} tabIndex={-1} className="mt-4 focus:outline-none">
                <Alert tone="error">{serverError}</Alert>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-forest text-sm font-semibold uppercase tracking-[0.12em] text-ivory transition hover:bg-forest-dark disabled:opacity-60"
            >
              <Lock size={16} aria-hidden />
              {submitting ? "Connecting to Paystack…" : `Pay now · ${formatMoney(totals.total)}`}
            </button>
            <p className="mt-3 text-center text-xs text-muted" aria-live="polite">
              {submitting
                ? "Setting up your secure payment. Please don't close this page — you'll be taken to Paystack in a moment."
                : "You'll complete payment securely with Paystack. We never see your card details."}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
