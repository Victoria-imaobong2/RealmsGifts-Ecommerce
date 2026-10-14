/**
 * Development seed. Non-destructive and refuses to run in production.
 *
 * The starter product catalogue lives in code (src/lib/catalog/products.ts),
 * so this only creates one clearly-labelled TEST order for trying out order
 * tracking locally: order RG-TESTORDR / test@example.com.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
    throw new Error("Refusing to seed a production database. Set ALLOW_SEED=1 to override.");
  }

  const existing = await prisma.order.findUnique({ where: { orderNumber: "RG-TESTORDR" } });
  if (existing) {
    console.log("Test order RG-TESTORDR already exists — nothing to do.");
    return;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: "RG-TESTORDR",
      email: "test@example.com",
      status: "PREPARING",
      currency: "USD",
      subtotal: 69.99,
      shippingFee: 8.99,
      giftWrapFee: 0,
      total: 78.98,
      deliveryType: "STANDARD",
      destination: "US",
      items: [
        {
          slug: "classic-red-rose-bouquet",
          name: "Classic Red Rose Bouquet",
          image: "https://images.unsplash.com/photo-1561729098-cbab0f7a9f7c",
          unitPrice: 69.99,
          quantity: 1,
          options: { Size: "12 stems" },
        },
      ],
      shippingAddress: { firstName: "Test", lastName: "Recipient", phone: "+1 555 0100", line1: "1 Test Street", city: "Testville", region: "NY", postalCode: "10001", country: "US" },
      gift: { message: "TEST ORDER — not a real purchase", hidePrice: true, wrap: false },
      paymentRef: "RG-TEST-REFERENCE",
      events: {
        create: [
          { status: "PENDING", note: "Seeded test order" },
          { status: "PAID", note: "Seeded test order (no real payment)" },
          { status: "PREPARING", note: "Seeded test order" },
        ],
      },
    },
  });
  console.log(`Created test order ${order.orderNumber} for test@example.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
