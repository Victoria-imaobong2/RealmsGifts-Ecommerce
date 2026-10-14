import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordOrderEvent, STATUS_LABELS } from "@/lib/orders";

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = (await req.json()) as { id?: string; status?: OrderStatus };
    if (!id || !status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    // Payment can only be confirmed by Paystack (webhook or verification).
    if (status === "PAID") {
      return NextResponse.json({ error: "Payment status is set automatically by Paystack." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });
    await recordOrderEvent(id, status, "Updated by staff");

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Order patch error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
