import { Check, XCircle } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { ORDER_TIMELINE, STATUS_LABELS } from "@/lib/order-status";

/**
 * Steps up to the order's server-recorded status are shown as complete, with
 * timestamps from recorded events. Nothing is estimated or simulated.
 */
export function OrderTimeline({ status, events }: { status: OrderStatus; events: { status: OrderStatus; createdAt: string | Date }[] }) {
  if (status === "CANCELLED" || status === "PAYMENT_FAILED") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-sale/5 p-4 text-sm text-sale">
        <XCircle size={18} aria-hidden /> {STATUS_LABELS[status]}
      </p>
    );
  }
  const reached = new Map<OrderStatus, string | Date>();
  for (const event of events) if (!reached.has(event.status)) reached.set(event.status, event.createdAt);
  const currentIndex = ORDER_TIMELINE.findIndex((step) => step.status === status);

  return (
    <ol className="relative space-y-6 pl-1">
      {ORDER_TIMELINE.map((step, index) => {
        const done = index <= currentIndex;
        const when = reached.get(step.status);
        const isCurrent = index === currentIndex;
        return (
          <li key={step.status} className="relative flex gap-4">
            {index < ORDER_TIMELINE.length - 1 && (
              <span aria-hidden className={cn("absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px", index < currentIndex ? "bg-forest" : "bg-line")} />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                done ? "border-forest bg-forest text-ivory" : "border-line bg-white text-muted",
              )}
            >
              {done ? <Check size={14} aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-line" />}
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-medium", done ? "text-ink" : "text-muted")}>
                {step.label}
                {isCurrent && <span className="sr-only"> (current status)</span>}
                {!done && <span className="sr-only"> (not yet reached)</span>}
              </p>
              {done && when && <p className="text-xs text-muted">{formatDate(when, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
