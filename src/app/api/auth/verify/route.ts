import { NextResponse } from "next/server";
import { hashToken, safeRedirectPath, startSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";

/**
 * Completes email sign-in. This is a POST (submitted from /login/confirm) so
 * that email link scanners which pre-fetch URLs can't consume the token.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  // Reject cross-site form posts (login CSRF). Browsers always send Origin on POST.
  const origin = req.headers.get("origin");
  const allowed = [url.origin, process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")].filter(Boolean);
  if (origin && !allowed.includes(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  const redirect = safeRedirectPath(String(form?.get("redirect") ?? ""));
  const failure = new URL(`/login?error=expired&redirect=${encodeURIComponent(redirect)}`, url.origin);

  if (!token || !isDatabaseConfigured()) return NextResponse.redirect(failure, 303);

  // Consume the token atomically so a link can only ever be used once.
  const tokenHash = hashToken(token);
  const consumed = await prisma.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (consumed.count !== 1) return NextResponse.redirect(failure, 303);

  const { email } = await prisma.loginToken.findUniqueOrThrow({ where: { tokenHash } });
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });

  // Attach earlier guest orders placed with this (now verified) email.
  await prisma.order.updateMany({ where: { email, userId: null }, data: { userId: user.id } });

  await startSession(user.id);
  return NextResponse.redirect(new URL(redirect, url.origin), 303);
}
