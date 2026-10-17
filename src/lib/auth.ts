import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma, isDatabaseConfigured } from "@/lib/db";

export const CUSTOMER_COOKIE = "customer_session";
export const SESSION_COOKIE = "rg_session";
const SESSION_TTL_DAYS = 30;
export const LOGIN_TOKEN_TTL_MINUTES = 20;

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export const newToken = () => crypto.randomBytes(32).toString("base64url");
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Only allow same-site relative redirects ("/account", not "//evil.com"). */
export function safeRedirectPath(input: string | null | undefined, fallback = "/account"): string {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.startsWith("/\\")) return fallback;
  return input;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isDatabaseConfigured()) return null;
  
  const cookieStore = await cookies();
  
  // 1. Direct Customer Session lookup (stores user.id directly)
  const customerUserId = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (customerUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: customerUserId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (user) return user;
    } catch (error) {
      console.error("[auth] Direct customer lookup failed:", error);
    }
  }

  // 2. Token-based Session lookup (fallback)
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.user;
  } catch (error) {
    console.error("[auth] Session lookup failed:", error);
    return null;
  }
}

export async function startSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } }).catch(() => undefined);
  
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && isDatabaseConfigured()) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }
  store.delete(CUSTOMER_COOKIE);
  store.delete(SESSION_COOKIE);
}

/** Staff access uses the existing ADMIN_SECRET_KEY cookie set by /api/auth/login. */
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY;
  const token = (await cookies()).get("admin_session")?.value;
  return Boolean(secret && token && safeEqual(token, secret));
}