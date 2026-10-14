import type { OrderStatus } from "@prisma/client";

/** Customer-facing timeline, in order. Only recorded events are shown as done. */
export const ORDER_TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Order received" },
  { status: "PAID", label: "Payment confirmed" },
  { status: "PREPARING", label: "Preparing your gift" },
  { status: "READY_FOR_DELIVERY", label: "Ready for delivery" },
  { status: "DISPATCHED", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Payment confirmed",
  PREPARING: "Preparing your gift",
  READY_FOR_DELIVERY: "Ready for delivery",
  DISPATCHED: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PAYMENT_FAILED: "Payment unsuccessful",
};
