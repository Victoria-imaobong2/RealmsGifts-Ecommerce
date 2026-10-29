import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Guard check
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // 2. Handle Direct Form-Data File Upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided in request" }, { status: 400 });
      }

      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const blob = await put(filename, file, { access: "public" });

      return NextResponse.json({ url: blob.url });
    }

    // 3. Fallback for raw file streams
    const filename = `upload-${Date.now()}.jpg`;
    const blob = await put(filename, request.body!, { access: "public" });

    return NextResponse.json({ url: blob.url });
  } catch (error: unknown) {
    console.error("[upload] Error uploading image:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}