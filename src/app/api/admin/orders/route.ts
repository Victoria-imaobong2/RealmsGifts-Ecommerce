import { NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordOrderEvent, STATUS_LABELS } from "@/lib/orders";

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(products);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load products";
    console.error("[admin] Products fetch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    console.error("Order patch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}