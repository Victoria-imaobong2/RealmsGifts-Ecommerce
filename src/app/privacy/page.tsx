import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Realmsgifts collects and uses your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Privacy" title="Privacy policy" intro="A plain-language summary of the information this website uses today." draft>
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Order details:</strong> your email, the recipient&apos;s name, phone and delivery address, your gift message, and what you ordered.</li>
          <li><strong>Account details:</strong> your email address and any recipients you choose to save.</li>
          <li><strong>Newsletter:</strong> your email address, only if you subscribe.</li>
          <li><strong>On your device:</strong> your bag, wishlist and preferred destination are stored in your browser.</li>
        </ul>
      </section>
      <section>
        <h2>Payments</h2>
        <p>Payments are processed by Paystack. Your card details go directly to Paystack and are never stored by Realmsgifts.</p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>To fulfil and deliver your order, send order and sign-in emails, provide order tracking, and — if you subscribe — send gift ideas you can unsubscribe from anytime.</p>
      </section>
      <section>
        <h2>Order tracking</h2>
        <p>Order lookup requires both your order number and the email used at checkout, and shows progress only — never addresses or payment information.</p>
      </section>
    </InfoPage>
  );
}
