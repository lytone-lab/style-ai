import { NextRequest, NextResponse } from "next/server";
import type { TryOnResult } from "@/lib/tryon/types";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const garmentId = form.get("garmentId") as string;
    
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const body: TryOnResult = {
      status: "preview_only",
      provider: null,
      garmentId: garmentId || "unknown",
      renderUrl: null,
      message: "Virtual Studio is in Preview Mode. No cloud rendering was performed.",
    };

    return NextResponse.json(body, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
