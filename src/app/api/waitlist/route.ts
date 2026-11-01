import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  let supabase;

  try {
    supabase = getSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Waitlist signup is not configured yet." }, { status: 503 });
  }

  let insertError: { code?: string; message: string } | null;

  try {
    const { error } = await supabase.from("waitlist").insert([{ email: email }]);
    insertError = error;
  } catch (error) {
    console.error("Waitlist insert transport failure:", error);
    return NextResponse.json(
      { error: "Waitlist service is unreachable. Check the Supabase project URL and server network." },
      { status: 503 },
    );
  }

  if (insertError?.code === "23505") {
    return NextResponse.json({ message: "You’re already on the list. We’ll be in touch." }, { status: 200 });
  }

  if (insertError) {
    console.error("Waitlist insert failed:", insertError.message);
    return NextResponse.json({ error: "We couldn’t add you just now. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "You’re on the list. Keep an eye on your inbox." }, { status: 201 });
}
