import { NextResponse } from "next/server";
import { getCatalog, toSummary } from "@/lib/catalog";
import { parseFilters, queryCatalog, searchTaxonomy } from "@/lib/catalog/query";

/**
 * Public catalogue query used by search, the gift finder and the wishlist.
 * ?slugs=a,b returns specific products; otherwise the usual shop filters apply.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const catalog = await getCatalog();
  const limit = Math.min(Number(params.limit) || 24, 60);

  let products;
  if (params.slugs !== undefined) {
    const slugs = params.slugs.split(",").filter(Boolean).slice(0, 100);
    products = slugs.map((slug) => catalog.find((p) => p.slug === slug)).filter((p) => p !== undefined);
  } else {
    products = queryCatalog(catalog, parseFilters(params));
  }

  return NextResponse.json(
    {
      total: products.length,
      products: products.slice(0, limit).map(toSummary),
      suggestions: params.q ? searchTaxonomy(params.q) : undefined,
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
