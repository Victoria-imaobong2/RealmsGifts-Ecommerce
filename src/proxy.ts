import { NextResponse, type NextRequest } from "next/server";

const STAFF_PREFIXES = ["/admin", "/api/admin", "/delivery/pod", "/api/delivery"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Staff-only areas: admin dashboard, admin APIs and courier proof-of-delivery.
  if (STAFF_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const adminToken = request.cookies.get("admin_session")?.value;

    // Check against an admin secret set in .env
    const validSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminToken || !validSecret || adminToken !== validSecret) {
      // Rewrite to 404 so unauthorized users cannot even verify the route exists
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/delivery/pod/:path*", "/api/delivery/:path*"],
};
