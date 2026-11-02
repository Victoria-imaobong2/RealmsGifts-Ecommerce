import { SITE } from "@/config/site";
import { formatMoney } from "@/lib/format";

/** Orders go to the number in NEXT_PUBLIC_WHATSAPP_NUMBER (set in Vercel); this is only a fallback. */
export const REALMS_GIFTS_WHATSAPP = SITE.whatsappNumber || "2348080634306";

export interface WhatsAppOrderPayload {
  orderNumber?: string | null;
  items: Array<{
    name: string;
    /** e.g. "Color: Red, Size: M" */
    options?: string;
    personalization?: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee?: number | null;
  giftWrapFee?: number | null;
  discount?: number | null;
  /** The amount actually paid. Falls back to items + delivery + gift wrap - discount. */
  total?: number | null;
  customer: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  delivery: {
    method?: string | null;
    date?: string | null;
    recipient?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    instructions?: string | null;
  };
  gift?: {
    message?: string | null;
    senderName?: string | null;
  };
  paymentMethod?: string | null;
}

export function createWhatsAppOrderMessage(order: WhatsAppOrderPayload): string {
  const items = order.items || [];

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const giftWrapFee = Number(order.giftWrapFee || 0);
  const discount = Number(order.discount || 0);
  const total = order.total ?? subtotal + deliveryFee + giftWrapFee - discount;

  const productDetails = items
    .map((item, index) =>
      [
        `${index + 1}. ${item.name}`,
        item.options ? `   Options: ${item.options}` : null,
        item.personalization ? `   Personalization: ${item.personalization}` : null,
        `   Quantity: ${item.quantity}`,
        `   Unit price: ${formatMoney(Number(item.price))}`,
        `   Item total: ${formatMoney(Number(item.price) * Number(item.quantity))}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  const orderNumHeader = order.orderNumber ? ` (#${order.orderNumber})` : "";
  const giftLines = [
    order.gift?.message ? `Gift message: ${order.gift.message}` : null,
    order.gift?.senderName ? `From: ${order.gift.senderName}` : null,
  ].filter(Boolean);

  return `🎁 *NEW ORDER - REALMS GIFTS*${orderNumHeader}

Hello Realms Gifts! I've just paid for this order.

🛍️ *ORDER DETAILS*
${productDetails}

--------------------------------
Subtotal: ${formatMoney(subtotal)}
Delivery fee: ${formatMoney(deliveryFee)}${giftWrapFee ? `\nGift wrap: ${formatMoney(giftWrapFee)}` : ""}${discount ? `\nDiscount: -${formatMoney(discount)}` : ""}
*TOTAL PAID: ${formatMoney(total)}*
--------------------------------

👤 *CUSTOMER DETAILS*
Name: ${order.customer.name || "Customer"}
Phone: ${order.customer.phone || "Not provided"}
Email: ${order.customer.email || "Not provided"}

🚚 *DELIVERY DETAILS*
Delivery method: ${order.delivery.method || "Standard"}${order.delivery.date ? `\nDelivery date: ${order.delivery.date}` : ""}
Recipient: ${order.delivery.recipient || order.customer.name || "N/A"}
Delivery phone: ${order.delivery.phone || order.customer.phone || "N/A"}
Address: ${order.delivery.address || "N/A"}
City: ${order.delivery.city || "N/A"}
State: ${order.delivery.state || "N/A"}
Country: ${order.delivery.country || "Nigeria"}
Delivery instructions: ${order.delivery.instructions || "None"}${giftLines.length ? `\n\n💌 *GIFT NOTE*\n${giftLines.join("\n")}` : ""}

💳 Payment: ${order.paymentMethod || "Paystack"}

Please confirm the order and delivery arrangements.

Thank you for choosing Realms Gifts! ❤️`;
}

export function sendOrderToWhatsApp(order: WhatsAppOrderPayload) {
  if (!order.items || order.items.length === 0) {
    alert("Please add at least one product to your order.");
    return;
  }

  const message = createWhatsAppOrderMessage(order);
  const whatsappURL = `https://wa.me/${REALMS_GIFTS_WHATSAPP}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, "_blank", "noopener,noreferrer");
}
