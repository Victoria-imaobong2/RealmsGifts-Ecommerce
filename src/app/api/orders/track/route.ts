import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { asLines, STATUS_LABELS } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const NOT_FOUND = "We couldn't find an order matching those details. Check your order number and the email used at checkout.";

/**
 * Order lookup requires the order number AND the checkout email. The response
 * deliberately omits the address, phone and payment details.
 */
export async function POST(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Order tracking is temporarily unavailable." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { orderNumber?: unknown; email?: unknown };
  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!/^(RG|MA)-[A-Z0-9]{6,12}$/.test(orderNumber) || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter your order number (e.g. RG-7KX29QPD) and email." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || order.email !== email) {
    return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    createdAt: order.createdAt,
    deliveryType: order.deliveryType,
    deliveryDate: order.deliveryDate,
    destination: order.destination,
    items: asLines(order.items).map((line) => ({ name: line.name, quantity: line.quantity, image: line.image })),
    events: order.events.map((event) => ({ status: event.status, createdAt: event.createdAt })),
    proofOfDelivery: order.podSignature ?? null,
  });
}
