import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/catalog/taxonomy";
import { prisma } from "@/lib/db";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (err) {
    console.error("[admin] Products fetch error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const title = body.title;
    const description = body.description || "";
    const price = Number.parseFloat(body.price);
    const stock = Number.parseInt(body.stock, 10);
    const imageUrl = body.imageUrl || body.image || "";
    const category = body.category || "gift-boxes";

    if (!title || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Please provide a valid product title, price above ₦0, and stock quantity." },
        { status: 400 }
      );
    }

    let slug = slugify(title);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const categorySlug = getCategory(category)?.slug ?? category;

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        description: description || title,
        price,
        stock,
        category: categorySlug,
        images: imageUrl ? [imageUrl] : [],
      },
    });

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error("[admin] Product create DB error:", error);
    const message = error instanceof Error ? error.message : "Database error creating product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, title, description, price, stock, imageUrl, category } = body;

    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const parsedPrice = price !== undefined ? Number.parseFloat(price) : undefined;
    const parsedStock = stock !== undefined ? Number.parseInt(stock, 10) : undefined;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(parsedPrice !== undefined && !Number.isNaN(parsedPrice) && { price: parsedPrice }),
        ...(parsedStock !== undefined && !Number.isNaN(parsedStock) && { stock: parsedStock }),
        ...(category && { category: getCategory(category)?.slug ?? category }),
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("[admin] Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, stock } = await req.json();
    const parsedStock = Number.parseInt(stock, 10);

    if (!id || Number.isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Valid product ID and stock quantity required." }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: parsedStock },
    });

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("[admin] Stock patch error:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}