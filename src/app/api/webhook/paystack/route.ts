import { NextResponse } from "next/server";
import { syncPaymentFromPaystack } from "@/lib/orders";
import { getPaystackConfig, verifyWebhookSignature } from "@/lib/paystack";

const HANDLED_EVENTS = new Set(["charge.success", "charge.failed"]);

/**
 * Paystack webhook. The signature proves the event came from Paystack, but the
 * payload is still only a hint: the order is updated from Paystack's verify
 * API, never from webhook fields. Returning 200 acknowledges the event; any
 * other status makes Paystack retry (for up to 72 hours), which is safe
 * because processing is idempotent.
 */
export async function POST(req: Request) {
  const config = getPaystackConfig();
  if (!config) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

  const body = await req.text();
  if (!verifyWebhookSignature(body, req.headers.get("x-paystack-signature"), config.secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: unknown } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = typeof event.data?.reference === "string" ? event.data.reference : "";
  if (!event.event || !HANDLED_EVENTS.has(event.event) || !reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const { outcome } = await syncPaymentFromPaystack(reference, { via: `webhook ${event.event}` });
    // Couldn't reach Paystack to verify: ask for a retry rather than guessing.
    if (outcome === "unverified") return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
    if (outcome === "not_found") console.warn("[webhook] Event for an unknown payment reference was ignored.");
    if (outcome === "mismatch") console.error("[webhook] Payment amount mismatch — order left unpaid for review.");
  } catch (error) {
    console.error("[webhook] Processing failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
