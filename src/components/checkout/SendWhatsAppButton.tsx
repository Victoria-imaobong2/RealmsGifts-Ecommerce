"use client";

import { MessageCircle } from "lucide-react";
import { sendOrderToWhatsApp, WhatsAppOrderPayload } from "@/lib/whatsapp-client";

export function SendWhatsAppButton({ order }: { order: WhatsAppOrderPayload }) {
  return (
    <button
      type="button"
      onClick={() => sendOrderToWhatsApp(order)}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1C3A30] px-6 py-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#152C24] active:scale-95"
    >
      <MessageCircle size={18} />
      Confirm & Send Order Details to WhatsApp
    </button>
  );
}