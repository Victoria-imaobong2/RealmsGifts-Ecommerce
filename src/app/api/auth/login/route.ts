import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { safeEqual } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // 1. Rate Limiting (5 attempts per 10 mins per IP)
  if (!rateLimit(`login:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const adminSecret = process.env.ADMIN_SECRET_KEY;

    // 2. Staff Authentication (Checks password against ADMIN_SECRET_KEY)
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

    // 3. Customer Authentication
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email address and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Set Customer Session Cookie
    const cookieStore = await cookies();
    cookieStore.set("customer_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}