import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { endSession } from "@/lib/auth";

export async function POST() {
  await endSession();
  (await cookies()).delete("admin_session");
  return NextResponse.json({ success: true });
}
