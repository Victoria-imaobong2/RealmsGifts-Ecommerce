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
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
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
    const { title, description, price, stock, imageUrl, colors, sizes, category } = body;

    const parsedPrice = Number.parseFloat(price);
    const parsedStock = Number.parseInt(stock, 10);

    if (!title || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Please provide a title, a price above ₦0, and a valid stock quantity." }, { status: 400 });
    }

    if (imageUrl && !imageUrl.startsWith("https://")) {
  return NextResponse.json({ error: "Image URL must start with https://" }, { status: 400 });
}

    let slug = slugify(title);
    if (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const variantColors: string[] = Array.isArray(colors) && colors.length > 0 ? colors : ["Default"];
    const variantSizes: string[] = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["Standard"];
    const totalVariants = variantColors.length * variantSizes.length;
    const variantStock = Math.floor(parsedStock / totalVariants);

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
              stock: Number.isNaN(variantStock) ? 0 : variantStock,
            }))
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
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, title, description, price, stock, imageUrl, category } = await req.json();

    if (!id) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

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
    });

    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/");

    return NextResponse.json({ success: true, product: updated });
  } catch (error: unknown) {
    console.error("[admin] Product stock patch error:", error);
    return NextResponse.json({ error: "Failed to update stock quantity" }, { status: 500 });
  }
}