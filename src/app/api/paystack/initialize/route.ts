import { NextResponse } from "next/server";
import type { DeliveryType } from "@prisma/client";
import {
  earliestScheduledDate,
  getDestination,
  getMethodAvailability,
  type DeliveryMethodId,
} from "@/config/delivery";
import { getCurrentUser, isValidEmail, normalizeEmail } from "@/lib/auth";
import { getProductBySlug } from "@/lib/catalog";
import { isAvailable } from "@/lib/catalog/query";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import {
  generateOrderNumber,
  generatePaymentReference,
  recordOrderEvent,
  type GiftDetails,
  type OrderLine,
  type ShippingAddress,
} from "@/lib/orders";
import { getPaystackConfig, initializeTransaction, toChargeAmount } from "@/lib/paystack";
import { computeTotals, MAX_QUANTITY } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isValidPhone, isValidUsZip } from "@/lib/validation";

const METHOD_TO_DELIVERY_TYPE: Record<DeliveryMethodId, DeliveryType> = {
  standard: "STANDARD",
  express: "EXPRESS",
  "same-day": "SAME_DAY",
  scheduled: "SCHEDULED",
};

interface CheckoutBody {
  checkoutKey?: unknown;
  customer?: unknown;
  email?: unknown;
  items?: unknown;
  destination?: unknown;
  address?: unknown;
  deliveryMethod?: unknown;
  deliveryDate?: unknown;
  gift?: unknown;
}

const str = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");

class CheckoutError extends Error {}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 60_000)) {
    return fail("Too many attempts. Please wait a minute and try again.", 429);
  }

  const paystack = getPaystackConfig();
  if (!paystack || !isDatabaseConfigured()) {
    return fail(
      "Online payment isn't available right now. Please contact our team to complete your order.",
      503,
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  try {
    // ── Duplicate submit: return the same Paystack checkout ────────────────
    const checkoutKey = str(body.checkoutKey, 64);
    if (!/^[A-Za-z0-9-]{16,64}$/.test(checkoutKey)) throw new CheckoutError("Please refresh the page and try again.");
    const existing = await prisma.order.findUnique({ where: { checkoutKey } });
    if (existing) {
      if (existing.status === "PENDING" && existing.authorizationUrl) {
        return NextResponse.json({ authorization_url: existing.authorizationUrl, orderNumber: existing.orderNumber });
      }
      if (existing.paidAt) throw new CheckoutError("This order has already been paid. Check your email for confirmation.");
      throw new CheckoutError("This checkout has expired. Please refresh the page and try again.");
    }

    // ── Customer ───────────────────────────────────────────────────────────
    const rawCustomer = (body.customer ?? {}) as Record<string, unknown>;
    const customerName = str(rawCustomer.fullName, 120);
    const customerPhone = str(rawCustomer.phone, 30);
    const email = normalizeEmail(str(body.email, 254));
    if (customerName.length < 2) throw new CheckoutError("Please enter your full name.");
    if (!isValidEmail(email)) throw new CheckoutError("Please enter a valid email address.");
    if (!isValidPhone(customerPhone)) throw new CheckoutError("Please enter a valid phone number for yourself.");

    // ── Destination & address ──────────────────────────────────────────────
    const destination = getDestination(str(body.destination, 4));
    if (!destination || destination.status !== "available") {
      throw new CheckoutError("We don't deliver to that destination yet.");
    }
    const raw = (body.address ?? {}) as Record<string, unknown>;
    const address: ShippingAddress = {
      firstName: str(raw.firstName, 60),
      lastName: str(raw.lastName, 60),
      phone: str(raw.phone, 30),
      line1: str(raw.line1, 120),
      line2: str(raw.line2, 120) || undefined,
      city: str(raw.city, 80),
      region: str(raw.region, 60) || undefined,
      postalCode: str(raw.postalCode, 12) || undefined,
      country: destination.code,
    };
    if (!address.firstName || !address.lastName || !address.line1 || !address.city) {
      throw new CheckoutError("Please complete the recipient's name and address.");
    }
    if (!isValidPhone(address.phone)) {
      throw new CheckoutError("Please enter a valid phone number for the recipient.");
    }
    if (destination.regions && !destination.regions.some((r) => r.code === address.region)) {
      throw new CheckoutError(`Please choose a ${destination.regionLabel.toLowerCase()}.`);
    }
    if (destination.postalRequired && !address.postalCode) {
      throw new CheckoutError(`Please enter a ${destination.postalLabel}.`);
    }
    if (destination.code === "US" && !isValidUsZip(address.postalCode ?? "")) {
      throw new CheckoutError("Please enter a valid 5-digit ZIP code.");
    }

    // ── Items: re-priced from the catalogue, never trusted from the client ─
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
      throw new CheckoutError("Your bag is empty.");
    }
    const lines: OrderLine[] = [];
    const eligibility: { sameDayEligible: boolean }[] = [];
    for (const rawItem of body.items as Record<string, unknown>[]) {
      const product = await getProductBySlug(str(rawItem?.slug, 120));
      if (!product) throw new CheckoutError("An item in your bag is no longer available. Please review your bag.");
      if (!isAvailable(product)) throw new CheckoutError(`${product.name} is out of stock.`);
      const quantity = Number(rawItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        throw new CheckoutError(`Please choose a quantity between 1 and ${MAX_QUANTITY}.`);
      }
      const rawOptions = (rawItem.options ?? {}) as Record<string, unknown>;
      const options: Record<string, string> = {};
      for (const option of product.options ?? []) {
        const value = str(rawOptions[option.name], 60);
        if (!option.values.includes(value)) {
          throw new CheckoutError(`Please choose a ${option.name.toLowerCase()} for ${product.name}.`);
        }
        options[option.name] = value;
      }
      const personalization = product.personalization
        ? str(rawItem.personalization, product.personalization.maxLength) || undefined
        : undefined;
      lines.push({
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? "",
        unitPrice: product.price,
        quantity,
        options,
        personalization,
      });
      eligibility.push({ sameDayEligible: product.sameDayEligible });
    }

    // ── Delivery ───────────────────────────────────────────────────────────
    const methodId = str(body.deliveryMethod, 20) as DeliveryMethodId;
    const availability = getMethodAvailability(destination.code, address.region, eligibility).find(
      (entry) => entry.method.id === methodId,
    );
    if (!availability) throw new CheckoutError("Please choose a delivery option.");
    if (!availability.available) throw new CheckoutError(availability.reason ?? "That delivery option isn't available.");
    let deliveryDate: Date | null = null;
    if (methodId === "scheduled") {
      const requested = str(body.deliveryDate, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requested) || requested < earliestScheduledDate(availability.method)) {
        throw new CheckoutError("Please choose an available delivery date.");
      }
      deliveryDate = new Date(`${requested}T12:00:00Z`);
    }

    // ── Gift ───────────────────────────────────────────────────────────────
    const rawGift = (body.gift ?? {}) as Record<string, unknown>;
    const gift: GiftDetails = {
      message: str(rawGift.message, 300) || undefined,
      senderName: str(rawGift.senderName, 80) || undefined,
      hidePrice: rawGift.hidePrice !== false,
      wrap: rawGift.wrap === true,
      instructions: str(rawGift.instructions, 300) || undefined,
    };

    // ── Totals & order ─────────────────────────────────────────────────────
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const totals = computeTotals(subtotal, availability.method.price, gift.wrap);
    const chargeAmount = toChargeAmount(totals.total, paystack);
    const reference = generatePaymentReference();
    const user = await getCurrentUser();

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user?.id,
        email,
        customerName,
        customerPhone,
        checkoutKey,
        status: "PENDING",
        currency: "USD",
        subtotal: totals.subtotal,
        shippingFee: totals.shipping,
        giftWrapFee: totals.giftWrap,
        total: totals.total,
        deliveryType: METHOD_TO_DELIVERY_TYPE[methodId],
        deliveryDate,
        destination: destination.code,
        items: lines as never,
        shippingAddress: address as never,
        gift: gift as never,
        chargeAmount,
        chargeCurrency: paystack.currency,
        paymentRef: reference,
      },
    });
    await recordOrderEvent(order.id, "PENDING", "Order created at checkout");

    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    const init = await initializeTransaction(paystack, {
      email,
      amount: chargeAmount,
      reference,
      callbackUrl: `${origin}/checkout/complete`,
      cancelUrl: `${origin}/checkout/complete?reference=${encodeURIComponent(reference)}&cancelled=1`,
      metadata: {
        orderNumber: order.orderNumber,
        custom_fields: [
          { display_name: "Order", variable_name: "order_number", value: order.orderNumber },
          { display_name: "Customer", variable_name: "customer_name", value: customerName },
        ],
      },
    });

    if (!init.ok) {
      console.error(`[checkout] Paystack initialize failed for ${order.orderNumber}: ${init.message}`);
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await recordOrderEvent(order.id, "CANCELLED", "Payment could not be started");
      return fail("We couldn't start the payment. Please try again in a moment.", 502);
    }

    await prisma.order.update({ where: { id: order.id }, data: { authorizationUrl: init.authorizationUrl } });
    return NextResponse.json({ authorization_url: init.authorizationUrl, orderNumber: order.orderNumber });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message);
    // Two submits raced on the same checkout key: the first one wins.
    if ((error as { code?: string }).code === "P2002") {
      return fail("Your payment is already being prepared. Please wait a moment.", 409);
    }
    console.error("[checkout] Unexpected error:", error instanceof Error ? error.message : "unknown");
    return fail("Something went wrong on our side. Please try again.", 500);
  }
}
