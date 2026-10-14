import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordOrderEvent } from "@/lib/orders";

const MAX_SIGNATURE_LENGTH = 400_000; // ~300 KB PNG data URL

/** Staff-only: records proof of delivery and marks the order delivered. */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, signature } = (await req.json()) as { orderId?: string; signature?: string | null };
    if (!orderId) return NextResponse.json({ error: "Order ID missing" }, { status: 400 });
    if (signature && (!signature.startsWith("data:image/png;base64,") || signature.length > MAX_SIGNATURE_LENGTH)) {
      return NextResponse.json({ error: "Invalid signature image" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED", podSignature: signature || null },
    });
    await recordOrderEvent(orderId, "DELIVERED", "Proof of delivery recorded");

    return NextResponse.json({ success: true, order: { id: updatedOrder.id, status: updatedOrder.status } });
  } catch (err) {
    console.error("[pod] Failed to record proof of delivery:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
