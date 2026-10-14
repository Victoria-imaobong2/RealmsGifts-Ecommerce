import { NextResponse } from "next/server";
import {
  hashToken,
  isValidEmail,
  LOGIN_TOKEN_TTL_MINUTES,
  newToken,
  normalizeEmail,
  safeRedirectPath,
} from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { EMAIL_FROM, emailLayout, isEmailConfigured, resend } from "@/lib/resend";

/** Emails a single-use sign-in link. Responds identically whether or not an account exists. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; redirect?: unknown };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!rateLimit(`login:${clientIp(req)}`, 5, 10 * 60_000) || !rateLimit(`login:${email}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many sign-in requests. Please try again in a few minutes." }, { status: 429 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }

  const devMode = process.env.NODE_ENV !== "production";
  if (!isEmailConfigured() && !devMode) {
    return NextResponse.json({ error: "Sign-in by email isn't available yet. Please check back soon." }, { status: 503 });
  }

  const token = newToken();
  await prisma.loginToken.create({
    data: {
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MINUTES * 60_000),
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const redirect = safeRedirectPath(typeof body.redirect === "string" ? body.redirect : null);
  const link = `${origin}/login/confirm?token=${token}&redirect=${encodeURIComponent(redirect)}`;

  if (isEmailConfigured()) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your Realmsgifts sign-in link",
      html: emailLayout(
        "Sign in to Realmsgifts",
        `<p style="margin:0 0 20px;color:#77776F">Tap the button below to sign in. This link expires in ${LOGIN_TOKEN_TTL_MINUTES} minutes and can only be used once.</p>
         <a href="${link}" style="display:inline-block;background:#173F35;color:#FAF7F0;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Sign in</a>
         <p style="margin:24px 0 0;font-size:12px;color:#77776F">If you didn't request this, you can safely ignore this email.</p>`,
      ),
    });
    if (error) {
      console.error("[auth] Sign-in email failed:", error);
      return NextResponse.json({ error: "We couldn't send the email. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  }

  // Local development without Resend: surface the link so the flow can be tested.
  console.info(`[auth] Development sign-in link for ${email}: ${link}`);
  return NextResponse.json({ sent: true, devLink: link });
}
