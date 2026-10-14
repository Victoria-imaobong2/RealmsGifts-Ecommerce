"use client";

import { useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { AVAILABLE_DESTINATIONS, getDestination } from "@/config/delivery";
import { Alert, Field, Input, Select } from "@/components/ui/primitives";

interface RecipientRow {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
}

const EMPTY = { nickname: "", firstName: "", lastName: "", phone: "", country: "US", line1: "", line2: "", city: "", region: "", postalCode: "" };

export function RecipientsManager({ initial }: { initial: RecipientRow[] }) {
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const destination = getDestination(form.country);
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mt-5 space-y-4">
      {rows.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-soft text-forest">
                  <UserRound size={18} aria-hidden />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-ink">{r.nickname}</p>
                  <p className="text-muted">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-muted">{r.city}, {getDestination(r.country)?.name ?? r.country}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${r.nickname}`}
                onClick={async () => {
                  const previous = rows;
                  setRows((all) => all.filter((x) => x.id !== r.id));
                  const res = await fetch(`/api/recipients?id=${encodeURIComponent(r.id)}`, { method: "DELETE" }).catch(() => null);
                  if (!res?.ok) setRows(previous);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-sale"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full border border-dashed border-forest/40 px-5 text-sm font-medium text-forest hover:bg-forest-soft">
          <Plus size={16} aria-hidden /> Add a recipient
        </button>
      ) : (
        <form
          className="rounded-3xl border border-line bg-white p-5 sm:p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError("");
            try {
              const res = await fetch("/api/recipients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setRows((all) => [data.recipient, ...all]);
              setForm(EMPTY);
              setAdding(false);
            } catch (err) {
              setError((err as Error).message || "Couldn't save. Please try again.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nickname" htmlFor="r-nickname" hint="e.g. Mom, Dad, Partner" className="sm:col-span-2">
              <Input id="r-nickname" required maxLength={40} value={form.nickname} onChange={set("nickname")} />
            </Field>
            <Field label="First name" htmlFor="r-first"><Input id="r-first" required value={form.firstName} onChange={set("firstName")} /></Field>
            <Field label="Last name" htmlFor="r-last"><Input id="r-last" required value={form.lastName} onChange={set("lastName")} /></Field>
            <Field label="Phone" htmlFor="r-phone" optional><Input id="r-phone" type="tel" value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Country" htmlFor="r-country">
              <Select id="r-country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value, region: "" }))}>
                {AVAILABLE_DESTINATIONS.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Street address" htmlFor="r-line1" className="sm:col-span-2"><Input id="r-line1" required value={form.line1} onChange={set("line1")} /></Field>
            <Field label={form.country === "US" ? "Apartment / Suite" : "Apartment or landmark"} htmlFor="r-line2" optional className="sm:col-span-2"><Input id="r-line2" value={form.line2} onChange={set("line2")} /></Field>
            <Field label="City" htmlFor="r-city"><Input id="r-city" required value={form.city} onChange={set("city")} /></Field>
            {destination?.regions && (
              <Field label={destination.regionLabel} htmlFor="r-region">
                <Select id="r-region" value={form.region} onChange={set("region")}>
                  <option value="">Select…</option>
                  {destination.regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </Select>
              </Field>
            )}
            <Field label={destination?.postalLabel ?? "Postal code"} htmlFor="r-postal" optional={!destination?.postalRequired}>
              <Input id="r-postal" value={form.postalCode} onChange={set("postalCode")} />
            </Field>
          </div>
          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="h-11 rounded-full bg-forest px-6 text-sm font-semibold text-ivory disabled:opacity-60">{saving ? "Saving…" : "Save recipient"}</button>
            <button type="button" onClick={() => setAdding(false)} className="h-11 rounded-full px-5 text-sm text-muted hover:text-ink">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
