"use client";

import { useCallback, useEffect, useState } from "react";
import { DELIVERY_METHOD_IDS, DESTINATIONS, getDestination, type DeliveryMethodId } from "@/config/delivery";
import { formatMoney } from "@/lib/format";

interface Rate {
  destination: string;
  methodId: string;
  price: number;
  currency: string;
  ngnRate: number;
}

const BUILT_IN = getDestination("NG")!.methods;
const methodLabel = (id: string) => BUILT_IN.find((m) => m.id === id)?.label ?? id;
const inputClass = "w-full rounded-lg border border-slate-200 p-2 text-xs";

async function send(method: "PUT" | "DELETE", body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/delivery-rates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error || "Something went wrong.";
  } catch {
    return "Network error. Please try again.";
  }
}

/** One method's fee for one destination ("*" = all countries, in Naira). */
function RateRow({
  destination,
  methodId,
  existing,
  fallbackNgn,
  countryCurrency,
  onChanged,
}: {
  destination: string;
  methodId: DeliveryMethodId;
  existing?: Rate;
  /** What the customer pays today if this row has no value of its own. */
  fallbackNgn: number;
  countryCurrency: string;
  onChanged: () => void;
}) {
  const isDefault = destination === "*";
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [currency, setCurrency] = useState(existing?.currency ?? (isDefault ? "NGN" : countryCurrency));
  const [rate, setRate] = useState(existing && existing.currency !== "NGN" ? String(existing.ngnRate) : "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (price.trim() === "") {
      alert("Enter a fee first (use 0 for free delivery).");
      return;
    }
    setBusy(true);
    const error = await send("PUT", { destination, methodId, price: Number(price), currency, ngnRate: currency === "NGN" ? 1 : Number(rate) });
    setBusy(false);
    if (error) alert(error);
    else onChanged();
  };

  const remove = async () => {
    setBusy(true);
    const error = await send("DELETE", { destination, methodId });
    setBusy(false);
    if (error) alert(error);
    else {
      setPrice("");
      setRate("");
      onChanged();
    }
  };

  const foreign = currency !== "NGN";
  const preview = foreign && Number(price) >= 0 && Number(rate) > 0 && price !== "" ? Number(price) * Number(rate) : null;

  return (
    <tr className="align-top">
      <td className="p-3 font-semibold text-slate-800">
        {methodLabel(methodId)}
        <p className="mt-0.5 text-[10px] font-normal text-slate-500">
          {existing ? "Custom fee set" : isDefault ? `Built-in: ${formatMoney(fallbackNgn)}` : `Using default: ${formatMoney(fallbackNgn)}`}
        </p>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <input
            aria-label={`${methodLabel(methodId)} fee`}
            type="number"
            min={0}
            step="any"
            placeholder={isDefault ? String(fallbackNgn) : "Use default"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
          {isDefault ? (
            <span className="rounded bg-slate-100 px-2 py-2 text-[11px] font-bold text-slate-600">NGN</span>
          ) : (
            <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg border border-slate-200 p-2 text-xs">
              {[...new Set(["NGN", countryCurrency])].map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          )}
        </div>
        {foreign && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <span className="whitespace-nowrap">1 {currency} = ₦</span>
            <input aria-label={`Naira per ${currency}`} type="number" min={0} step="any" value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} />
          </div>
        )}
        {preview !== null && <p className="mt-1 text-[10px] text-slate-500">Customer pays {formatMoney(preview)}</p>}
      </td>
      <td className="p-3 text-right">
        <button type="button" onClick={save} disabled={busy} className="rounded bg-forest px-3 py-1.5 font-bold text-white disabled:opacity-50">
          Save
        </button>
        {!isDefault && existing && (
          <button type="button" onClick={remove} disabled={busy} className="ml-2 text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50">
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}

export function DeliveryRatesManager() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("US");
  const [version, setVersion] = useState(0);

  const load = useCallback(() => {
    return fetch("/api/admin/delivery-rates")
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => null) }))
      .catch(() => ({ ok: false, data: null }))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data?.error || "Couldn't load delivery fees.");
          return;
        }
        setError("");
        setRates(data as Rate[]);
        setVersion((v) => v + 1);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const find = (destination: string, methodId: string) => rates.find((r) => r.destination === destination && r.methodId === methodId);
  const defaultNgn = (methodId: DeliveryMethodId) => find("*", methodId)?.price ?? BUILT_IN.find((m) => m.id === methodId)!.price;
  const destination = getDestination(country);
  const overrides = rates.filter((r) => r.destination !== "*");

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
          {error} If this is the first time, the database needs updating (<code>npx prisma db push</code>).
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-900">Default delivery fees (₦)</h2>
          <p className="text-xs text-slate-500">One fee per method, applied to every country and every Nigerian state unless you set a country below. Update these whenever your dispatch riders&apos; prices change.</p>
        </div>
        <table className="w-full border-collapse text-left text-xs">
          <tbody className="divide-y divide-slate-100">
            {DELIVERY_METHOD_IDS.map((id) => (
              <RateRow
                key={`${id}-${version}`}
                destination="*"
                methodId={id}
                existing={find("*", id)}
                fallbackNgn={BUILT_IN.find((m) => m.id === id)!.price}
                countryCurrency="NGN"
                onChanged={load}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-900">Adjust for a specific country</h2>
          <p className="text-xs text-slate-500">
            Optional. Pick a country, then set a fee in its own currency (or Naira). Leave a fee blank to keep the default above. Customers still pay in Naira, using the exchange rate you enter.
          </p>
          <label htmlFor="rate-country" className="mt-3 block text-xs font-semibold text-slate-700">
            Country
          </label>
          <select id="rate-country" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 p-2 text-xs">
            {DESTINATIONS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} ({d.currency})
              </option>
            ))}
          </select>
        </div>
        {destination && (
          <table className="w-full border-collapse text-left text-xs">
            <tbody className="divide-y divide-slate-100">
              {DELIVERY_METHOD_IDS.map((id) => (
                <RateRow
                  key={`${country}-${id}-${version}`}
                  destination={country}
                  methodId={id}
                  existing={find(country, id)}
                  fallbackNgn={defaultNgn(id)}
                  countryCurrency={destination.currency}
                  onChanged={load}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {overrides.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-slate-900">Active country adjustments</h2>
          <ul className="space-y-1 text-xs text-slate-700">
            {overrides.map((r) => (
              <li key={`${r.destination}-${r.methodId}`}>
                <strong>{getDestination(r.destination)?.name ?? r.destination}</strong> · {methodLabel(r.methodId)}:{" "}
                {r.currency === "NGN" ? formatMoney(r.price) : `${formatMoney(r.price, r.currency)} (≈ ${formatMoney(r.price * r.ngnRate)})`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
