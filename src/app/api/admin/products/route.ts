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
      include: { variants: true },
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
    const { title, description, price, stock, imageUrl, colors, sizes, category } = await req.json();

    const parsedPrice = Number.parseFloat(price);
    const parsedStock = Number.parseInt(stock, 10);
    if (!title || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Please provide a title, a price above ₦0, and a stock quantity." }, { status: 400 });
    }
    if (imageUrl && !/^https:\/\//.test(imageUrl)) {
      return NextResponse.json({ error: "Image URL must start with https://" }, { status: 400 });
    }

    let slug = slugify(title);
    if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

    const variantColors: string[] = colors?.length ? colors : ["Default"];
    const variantSizes: string[] = sizes?.length ? sizes : ["Standard"];
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        category: getCategory(category)?.slug ?? null,
        description: description || title,
        price: parsedPrice,
        stock: parsedStock,
        images: imageUrl ? [imageUrl] : [],
        variants: {
          create: variantColors.flatMap((color) =>
            variantSizes.map((size) => ({
              color,
              size,
              stock: Math.floor(parsedStock / (variantColors.length * variantSizes.length)),
            })),
          ),
        },
      },
      include: { variants: true },
    });

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error("[admin] Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, title, description, price, stock, imageUrl, category } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

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
      include: { variants: true },
    });

    // If stock changed, also update primary variant stock
    if (parsedStock !== undefined && updated.variants.length > 0) {
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { stock: Math.floor(parsedStock / updated.variants.length) },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product: updated });
  } catch (error: unknown) {
    console.error("[admin] Product update error:", error);
    return NextResponse.json({ error: "Failed to update product details" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, stock } = await req.json();

    const parsedStock = Number.parseInt(stock, 10);
    if (!id || Number.isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Valid product ID and non-negative stock quantity required." }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: parsedStock },
      include: { variants: true },
    });

    // Keep variants in sync with top-level stock
    if (updated.variants.length > 0) {
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { stock: Math.floor(parsedStock / updated.variants.length) },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product: updated });
  } catch (error: unknown) {
    console.error("[admin] Stock patch error:", error);
    return NextResponse.json({ error: "Failed to update stock quantity" }, { status: 500 });
  }
}