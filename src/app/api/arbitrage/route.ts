import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: scans } = await supabase.from("scans").select("detected_items").eq("user_id", user.id);
    
    if (!scans || scans.length === 0) {
      return NextResponse.json({ item: "Basics", reason: "Scan a few outfits first so we can analyze your wardrobe gaps." });
    }

    // FIX: Safely extract item names whether they are strings or objects
    const allItems = scans.flatMap(s => s.detected_items || []).map((item: any) => {
      if (typeof item === "string") return item.toLowerCase();
      if (typeof item === "object" && item?.name) return item.name.toLowerCase();
      return "";
    }).filter(Boolean);

    if (allItems.length === 0) {
      return NextResponse.json({ item: "Basics", reason: "Your closet needs more items before we can find gaps." });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing Groq API Key" }, { status: 500 });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a fashion stylist. Based on the user's closet items, suggest ONE missing item that would unlock many new outfit combinations. Return JSON: { 'item': 'Name', 'reason': 'Short reason' }" },
          { role: "user", content: `My closet: ${allItems.slice(0, 50).join(", ")}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("Groq API failed");
    
    const payload = await response.json();
    const result = JSON.parse(payload.choices[0].message.content);
    return NextResponse.json(result);

  } catch (error) {
    // FIX: Honest fallback instead of fake math
    return NextResponse.json({ item: "White Tee", reason: "A versatile base layer pairs with almost anything." });
  }
}
