import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/catalog/taxonomy";
import { prisma } from "@/lib/db";

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

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
    const { title, description, price, stock, imageUrl, colors, sizes, category } = await req.json();

    const parsedPrice = Number.parseFloat(price);
    const parsedStock = Number.parseInt(stock, 10);
    if (!title || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Please provide a title, a price above $0 and a stock quantity." }, { status: 400 });
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

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error("[admin] Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
