import { notFound } from "next/navigation";
import { SendWhatsAppButton } from "@/components/checkout/SendWhatsAppButton";
import { prisma } from "@/lib/db";
import { asLines, ShippingAddress } from "@/lib/orders";

interface PageProps {
  searchParams: Promise<{ id?: string; orderNumber?: string }>;
}

export default async function CheckoutCompletePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.id || params.orderNumber;

  if (!orderId) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
  });

  if (!order) {
    notFound();
  }

  const items = asLines(order.items).map((item) => ({
    name: item.name,
    size: item.options?.Size || item.options?.["US Size"] || undefined,
    quantity: item.quantity,
    price: item.unitPrice,
  }));

  const address = (order.shippingAddress ?? {}) as unknown as ShippingAddress;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 className="mb-2 font-serif text-2xl font-bold text-slate-900">Order Received!</h1>
        <p className="mb-6 text-xs text-slate-500">
          Order #{order.orderNumber ?? order.id.slice(-8)} has been recorded. Tap below to confirm and send your order details directly to our WhatsApp support team.
        </p>

        <SendWhatsAppButton
          order={{
            orderNumber: order.orderNumber ?? order.id.slice(-8),
            items,
            deliveryFee: order.shippingFee ?? 0,
            discount: 0,
            customer: {
              name: order.customerName ?? "Customer",
              phone: order.customerPhone ?? "",
              email: order.email ?? "",
            },
            delivery: {
              method: order.deliveryType ?? "Standard",
              recipient: `${address.firstName ?? ""} ${address.lastName ?? ""}`.trim() || order.customerName || "Customer",
              phone: address.phone ?? order.customerPhone ?? "",
              address: address.line1 ?? "",
              city: address.city ?? "",
              state: address.region ?? "N/A",
              country: address.country ?? "Nigeria",
            },
            paymentMethod: "Paystack (Online Payment)",
          }}
        />
      </div>
    </div>
  );
}