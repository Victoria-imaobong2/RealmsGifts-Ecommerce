import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/catalog";
import { prisma } from "@/lib/db";

const unauthorized = () => NextResponse.json({ error: "Sign in to sync your wishlist." }, { status: 401 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ slugs: items.map((item) => item.productSlug) }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Adds one or more products (also used to merge a guest wishlist after sign-in). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { slugs?: unknown };
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s): s is string => typeof s === "string").slice(0, 100) : [];
  const valid: string[] = [];
  for (const slug of slugs) if (await getProductBySlug(slug)) valid.push(slug);
  if (valid.length) {
    await prisma.wishlistItem.createMany({
      data: valid.map((productSlug) => ({ userId: user.id, productSlug })),
      skipDuplicates: true,
    });
  }
  return NextResponse.json({ added: valid });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing product" }, { status: 400 });
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productSlug: slug } });
  return NextResponse.json({ removed: slug });
}
