/**
 * Server-only Paystack client.
 */
import crypto from "crypto";

const DEFAULT_API = "https://api.paystack.co";

function apiBase(): string {
  const override = process.env.PAYSTACK_API_BASE;
  if (override && process.env.NODE_ENV !== "production") return override.replace(/\/$/, "");
  return DEFAULT_API;
}

export interface PaystackConfig {
  secretKey: string;
  mode: "test" | "live";
  currency: "USD" | "NGN" | "GHS" | "KES" | "ZAR";
  usdRate: number;
}

let warnedLiveInDev = false;

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

  // Fallback to NGN if process.env.PAYSTACK_CURRENCY is not explicitly set to USD
  const currency = (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase() as PaystackConfig["currency"];
  
  // Provide a sensible fallback rate if PAYSTACK_USD_RATE is missing (e.g. 1 USD = 1500 NGN)
  const rawRate = Number(process.env.PAYSTACK_USD_RATE);
  const usdRate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : (currency === "USD" ? 1 : 1500);

  return { secretKey, mode, currency, usdRate };
}

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
        metadata: { ...params.metadata, cancel_action: params.cancelUrl },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: { authorization_url?: string } } | null;
    
    if (!res.ok || !data?.status || !data.data?.authorization_url) {
      console.error("[paystack initialize error]:", data);
      return { ok: false, message: data?.message || `HTTP ${res.status}` };
    }
    return { ok: true, authorizationUrl: data.data.authorization_url };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Network error" };
  }
}

export interface VerifiedTransaction {
  status: string;
  amount: number;
  currency: string;
  reference: string;
}

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

export function verifyWebhookSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}