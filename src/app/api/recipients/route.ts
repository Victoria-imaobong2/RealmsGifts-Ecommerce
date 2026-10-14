import { NextResponse } from "next/server";
import { getDestination } from "@/config/delivery";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function parseRecipient(body: Record<string, unknown>) {
  const destination = getDestination(str(body.country, 4));
  const data = {
    nickname: str(body.nickname, 40),
    firstName: str(body.firstName, 60),
    lastName: str(body.lastName, 60),
    phone: str(body.phone, 30) || null,
    country: destination?.code ?? "",
    line1: str(body.line1, 120),
    line2: str(body.line2, 120) || null,
    city: str(body.city, 80),
    region: str(body.region, 60) || null,
    postalCode: str(body.postalCode, 12) || null,
  };
  if (!destination) return { error: "Please choose a country." } as const;
  if (!data.nickname || !data.firstName || !data.lastName || !data.line1 || !data.city) {
    return { error: "Please complete the nickname, name and address." } as const;
  }
  return { data } as const;
}

// Every query below is scoped to the signed-in user's id, so customers can
// only ever read or change their own recipients.

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const recipients = await prisma.recipient.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ recipients }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await prisma.recipient.count({ where: { userId: user.id } });
  if (count >= 50) return NextResponse.json({ error: "You've reached the limit of saved recipients." }, { status: 400 });
  const parsed = parseRecipient((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const recipient = await prisma.recipient.create({ data: { ...parsed.data, userId: user.id } });
  return NextResponse.json({ recipient });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const { count } = await prisma.recipient.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  return NextResponse.json({ removed: id });
}
