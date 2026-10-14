/**
 * Server-only Paystack client. The secret key is read from the environment
 * here and nowhere else; it is never returned, logged or sent to the browser.
 */
import crypto from "crypto";

const DEFAULT_API = "https://api.paystack.co";

/**
 * Local development may point at a mock server (PAYSTACK_API_BASE) to test the
 * full flow without real cards. Ignored in production so the secret key can
 * only ever be sent to Paystack.
 */
function apiBase(): string {
  const override = process.env.PAYSTACK_API_BASE;
  if (override && process.env.NODE_ENV !== "production") return override.replace(/\/$/, "");
  return DEFAULT_API;
}

export interface PaystackConfig {
  secretKey: string;
  mode: "test" | "live";
  /** Currency the merchant account charges in. USD requires a USD-enabled Paystack account. */
  currency: "USD" | "NGN" | "GHS" | "KES" | "ZAR";
  /** Only used when charging in a non-USD currency: how many units of it per 1 USD. */
  usdRate: number;
}

let warnedLiveInDev = false;

/** Returns null when payments can't be taken — the checkout then says so instead of faking it. */
export function getPaystackConfig(): PaystackConfig | null {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) return null;
  if (!secretKey.startsWith("sk_")) {
    console.error("[paystack] PAYSTACK_SECRET_KEY is not a secret key (it should start with sk_). Payments are disabled.");
    return null;
  }
  const mode = secretKey.startsWith("sk_live_") ? "live" : "test";
  if (mode === "live" && process.env.NODE_ENV !== "production" && !warnedLiveInDev) {
    warnedLiveInDev = true;
    console.warn("[paystack] A LIVE secret key is configured outside production. Real cards will be charged.");
  }

  const currency = (process.env.PAYSTACK_CURRENCY || "USD").toUpperCase() as PaystackConfig["currency"];
  if (currency === "USD") return { secretKey, mode, currency, usdRate: 1 };
  const usdRate = Number(process.env.PAYSTACK_USD_RATE);
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    console.error(`[paystack] PAYSTACK_CURRENCY=${currency} requires a positive PAYSTACK_USD_RATE. Payments are disabled.`);
    return null;
  }
  return { secretKey, mode, currency, usdRate };
}

/** Converts a USD total to the minor units Paystack expects (cents, kobo…). */
export function toChargeAmount(totalUsd: number, config: PaystackConfig): number {
  return Math.round(totalUsd * config.usdRate * 100);
}

const TIMEOUT_MS = 15_000;

export async function initializeTransaction(
  config: PaystackConfig,
  params: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl: string;
    cancelUrl: string;
    metadata: Record<string, unknown>;
  },
): Promise<{ ok: true; authorizationUrl: string } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${apiBase()}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        currency: config.currency,
        reference: params.reference,
        callback_url: params.callbackUrl,
        // Paystack Checkout sends the customer here if they press "Cancel".
        metadata: { ...params.metadata, cancel_action: params.cancelUrl },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: { authorization_url?: string } } | null;
    if (!res.ok || !data?.status || !data.data?.authorization_url) {
      return { ok: false, message: data?.message || `HTTP ${res.status}` };
    }
    return { ok: true, authorizationUrl: data.data.authorization_url };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.name : "Network error" };
  }
}

export interface VerifiedTransaction {
  status: string;
  amount: number;
  currency: string;
  reference: string;
}

/** Server-side verification — the source of truth for every payment state change. */
export async function verifyTransaction(config: PaystackConfig, reference: string): Promise<VerifiedTransaction | null> {
  const res = await fetch(`${apiBase()}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.secretKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => null)) as { status?: boolean; data?: VerifiedTransaction } | null;
  if (!res.ok || !data?.status || !data.data) return null;
  return {
    status: String(data.data.status),
    amount: Number(data.data.amount),
    currency: String(data.data.currency),
    reference: String(data.data.reference),
  };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
