import crypto from "crypto";
import type { Order, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getPaystackConfig, verifyTransaction } from "@/lib/paystack";
import { EMAIL_FROM, emailLayout, escapeHtml, isEmailConfigured, resend } from "@/lib/resend";

export interface OrderLine {
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  options: Record<string, string>;
  personalization?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
}

export interface GiftDetails {
  message?: string;
  senderName?: string;
  hidePrice: boolean;
  wrap: boolean;
  instructions?: string;
}

export { ORDER_TIMELINE, STATUS_LABELS } from "@/lib/order-status";

const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateOrderNumber(): string {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (const byte of bytes) code += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
  return `RG-${code}`;
}

/** Unguessable payment reference (Paystack allows alphanumerics, -, ., =). */
export const generatePaymentReference = () => `RG-${crypto.randomBytes(12).toString("hex")}`;

export async function recordOrderEvent(orderId: string, status: OrderStatus, note?: string) {
  await prisma.orderEvent.create({ data: { orderId, status, note } });
}

export type PaymentOutcome =
  | "paid" // verified successful payment
  | "failed" // Paystack reports the charge failed or was reversed
  | "cancelled" // customer cancelled on Paystack Checkout
  | "pending" // not paid yet (abandoned, processing, queued…)
  | "unverified" // couldn't reach Paystack, or payments aren't configured
  | "mismatch" // paid amount/currency doesn't match the order — never marked paid
  | "not_found";

/**
 * The single place where payment state changes. It always asks Paystack's
 * verify API for the truth — webhook payloads and redirect query parameters
 * are only treated as a hint that something may have changed. Safe to call
 * any number of times: transitions are conditional updates, so duplicate
 * webhooks, refreshes and retries are no-ops.
 */
export async function syncPaymentFromPaystack(
  reference: string,
  { via, customerCancelled = false }: { via: string; customerCancelled?: boolean },
): Promise<{ outcome: PaymentOutcome; order: Order | null }> {
  const order = await prisma.order.findUnique({ where: { paymentRef: reference } });
  if (!order) return { outcome: "not_found", order: null };
  if (order.paidAt) return { outcome: "paid", order };

  const config = getPaystackConfig();
  if (!config) return { outcome: "unverified", order };
  const tx = await verifyTransaction(config, reference).catch(() => null);
  if (!tx) return { outcome: "unverified", order };

  await prisma.order.update({ where: { id: order.id }, data: { gatewayStatus: tx.status } });

  if (tx.status === "success") {
    const expectedAmount = order.chargeAmount ?? Math.round(order.total * 100);
    const expectedCurrency = (order.chargeCurrency ?? "USD").toUpperCase();
    if (tx.amount !== expectedAmount || tx.currency.toUpperCase() !== expectedCurrency || tx.reference !== reference) {
      console.error(`[orders] Payment mismatch on order ${order.orderNumber}: expected ${expectedAmount} ${expectedCurrency}`);
      await recordOrderEvent(order.id, order.status, "Payment amount did not match — needs review");
      return { outcome: "mismatch", order };
    }
    const updated = await prisma.order.updateMany({
      where: { id: order.id, paidAt: null },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (updated.count === 1) {
      await recordOrderEvent(order.id, "PAID", `Payment verified with Paystack (${via})`);
      await sendOrderConfirmation(order.id).catch((error) => console.error("[orders] Confirmation email failed:", error));
    }
    return { outcome: "paid", order: await prisma.order.findUnique({ where: { id: order.id } }) };
  }

  if (tx.status === "failed" || tx.status === "reversed") {
    await transition(order.id, ["PENDING"], "PAYMENT_FAILED", `Paystack reported "${tx.status}"`);
    return { outcome: "failed", order: await prisma.order.findUnique({ where: { id: order.id } }) };
  }

  // "abandoned" means checkout was opened but not completed. Only the customer
  // pressing Cancel on Paystack Checkout turns that into a cancelled order.
  if (tx.status === "abandoned" && customerCancelled) {
    await transition(order.id, ["PENDING"], "CANCELLED", "Customer cancelled on Paystack Checkout");
    return { outcome: "cancelled", order: await prisma.order.findUnique({ where: { id: order.id } }) };
  }

  const current = await prisma.order.findUnique({ where: { id: order.id } });
  if (current?.status === "CANCELLED") return { outcome: "cancelled", order: current };
  if (current?.status === "PAYMENT_FAILED") return { outcome: "failed", order: current };
  return { outcome: "pending", order: current };
}

async function transition(orderId: string, from: OrderStatus[], to: OrderStatus, note: string) {
  const updated = await prisma.order.updateMany({ where: { id: orderId, status: { in: from }, paidAt: null }, data: { status: to } });
  if (updated.count) await recordOrderEvent(orderId, to, note);
}

export const asLines = (value: Prisma.JsonValue | null): OrderLine[] =>
  Array.isArray(value) ? (value as unknown as OrderLine[]) : [];

async function sendOrderConfirmation(orderId: string) {
  if (!isEmailConfigured()) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.email) return;
  const lines = asLines(order.items);
  const rows = lines
    .map(
      (line) =>
        `<tr><td style="padding:6px 0">${escapeHtml(line.name)} × ${line.quantity}</td><td style="padding:6px 0;text-align:right">${formatMoney(line.unitPrice * line.quantity)}</td></tr>`,
    )
    .join("");
  await resend.emails.send({
    from: EMAIL_FROM,
    to: order.email,
    subject: `Your Realmsgifts order ${order.orderNumber ?? ""} is confirmed`,
    html: emailLayout(
      "Thank you — your gift is on its way to being made special.",
      `<p style="margin:0 0 16px;color:#77776F">Order <strong style="color:#252923">${escapeHtml(order.orderNumber ?? order.id)}</strong> · Payment confirmed</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
         <tr><td style="padding:12px 0 0;border-top:1px solid #E6E1D7"><strong>Total</strong></td><td style="padding:12px 0 0;border-top:1px solid #E6E1D7;text-align:right"><strong>${formatMoney(order.total, order.currency)}</strong></td></tr>
       </table>
       <p style="margin:20px 0 0;font-size:14px;color:#77776F">Track your order anytime with your order number and this email address.</p>`,
    ),
  });
}
