import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DELIVERY_METHOD_IDS, getDestination } from "@/config/delivery";

const isMethodId = (value: unknown): value is (typeof DELIVERY_METHOD_IDS)[number] =>
  typeof value === "string" && (DELIVERY_METHOD_IDS as string[]).includes(value);

/** "*" is the all-countries default; anything else must be a real destination. */
const isDestination = (value: unknown): value is string =>
  typeof value === "string" && (value === "*" || getDestination(value) !== undefined);

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rates = await prisma.deliveryRate.findMany({ orderBy: [{ destination: "asc" }, { methodId: "asc" }] });
    return NextResponse.json(rates);
  } catch (error: unknown) {
    console.error("[admin] Delivery rates fetch error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load delivery rates" }, { status: 500 });
  }
}

/** Creates or updates one fee: { destination, methodId, price, currency?, ngnRate? }. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { destination, methodId } = body;
    if (!isDestination(destination) || !isMethodId(methodId)) {
      return NextResponse.json({ error: "Choose a valid country and delivery method." }, { status: 400 });
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Enter a delivery fee of 0 or more." }, { status: 400 });
    }

    // The all-countries default is always Naira; a country override may use another currency.
    const currency = destination === "*" ? "NGN" : String(body.currency ?? "NGN").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "Currency must be a 3-letter code, e.g. USD." }, { status: 400 });
    }
    const ngnRate = currency === "NGN" ? 1 : Number(body.ngnRate);
    if (!Number.isFinite(ngnRate) || ngnRate <= 0) {
      return NextResponse.json({ error: `Enter how many Naira equal 1 ${currency}.` }, { status: 400 });
    }

    const rate = await prisma.deliveryRate.upsert({
      where: { destination_methodId: { destination, methodId } },
      update: { price, currency, ngnRate },
      create: { destination, methodId, price, currency, ngnRate },
    });

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, rate });
  } catch (error: unknown) {
    console.error("[admin] Delivery rate save error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save delivery rate" }, { status: 500 });
  }
}

/** Removes a country override so that country falls back to the default fee. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { destination, methodId } = (await req.json()) as Record<string, unknown>;
    if (!isDestination(destination) || destination === "*" || !isMethodId(methodId)) {
      return NextResponse.json({ error: "Choose a country override to remove." }, { status: 400 });
    }
    await prisma.deliveryRate.deleteMany({ where: { destination, methodId } });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[admin] Delivery rate delete error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to remove override" }, { status: 500 });
  }
}
