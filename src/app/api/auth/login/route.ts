import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeEqual } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Staff sign-in with the ADMIN_SECRET_KEY. Customers sign in by email link instead. */
export async function POST(req: Request) {
  if (!rateLimit(`admin-login:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }
  try {
    const { password } = (await req.json()) as { password?: string };
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (adminSecret && typeof password === "string" && safeEqual(password, adminSecret)) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", adminSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return NextResponse.json({ success: true, role: "ADMIN" });
    }

    return NextResponse.json({ error: "Incorrect staff password." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
