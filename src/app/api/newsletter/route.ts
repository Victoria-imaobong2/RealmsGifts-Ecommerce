import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`newsletter:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Sign-ups are temporarily unavailable." }, { status: 503 });
  }
  await prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
  return NextResponse.json({ subscribed: true });
}
