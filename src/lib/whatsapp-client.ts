import { formatMoney } from "@/lib/format";

export const REALMS_GIFTS_WHATSAPP = "2348080634306";

export interface WhatsAppOrderPayload {
  orderNumber?: string | null;
  items: Array<{
    name: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee?: number | null;
  discount?: number | null;
  customer: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  delivery: {
    method?: string | null;
    recipient?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    instructions?: string | null;
  };
  paymentMethod?: string | null;
}

export function createWhatsAppOrderMessage(order: WhatsAppOrderPayload): string {
  const items = order.items || [];

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const total = subtotal + deliveryFee - discount;

  const productDetails = items
    .map((item, index) => {
      return [
        `${index + 1}. ${item.name}`,
        `   Size: ${item.size || "Not applicable"}`,
        `   Quantity: ${item.quantity}`,
        `   Unit price: ${formatMoney(Number(item.price))}`,
        `   Item total: ${formatMoney(Number(item.price) * Number(item.quantity))}`,
      ].join("\n");
    })
    .join("\n\n");

  const orderNumHeader = order.orderNumber ? ` (#${order.orderNumber})` : "";

  return `🎁 *NEW ORDER - REALMS GIFTS*${orderNumHeader}

Hello Realms Gifts! I'd like to place an order.

🛍️ *ORDER DETAILS*
${productDetails}

--------------------------------
Subtotal: ${formatMoney(subtotal)}
Delivery fee: ${formatMoney(deliveryFee)}
Discount: ${formatMoney(discount)}
*TOTAL: ${formatMoney(total)}*
--------------------------------

👤 *CUSTOMER DETAILS*
Name: ${order.customer.name || "Customer"}
Phone: ${order.customer.phone || "Not provided"}
Email: ${order.customer.email || "Not provided"}

🚚 *DELIVERY DETAILS*
Delivery method: ${order.delivery.method || "Standard"}
Recipient: ${order.delivery.recipient || order.customer.name || "N/A"}
Delivery phone: ${order.delivery.phone || order.customer.phone || "N/A"}
Address: ${order.delivery.address || "N/A"}
City: ${order.delivery.city || "N/A"}
State: ${order.delivery.state || "N/A"}
Country: ${order.delivery.country || "Nigeria"}

Delivery instructions: ${order.delivery.instructions || "None"}

💳 Payment method: ${order.paymentMethod || "Paystack"}

Please confirm the order, delivery arrangements and payment details.

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