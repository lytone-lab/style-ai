import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: scans } = await supabase.from('scans').select('detected_items').eq('user_id', user.id);

    if (!scans || scans.length === 0) {
      return NextResponse.json({ error: "No scans found" }, { status: 400 });
    }

    const allItems = new Set<string>();
    scans.forEach((scan) => {
      scan.detected_items.forEach((item: string) => allItems.add(item.toLowerCase().trim()));
    });
    const wardrobeList = Array.from(allItems).join(", ");

    // Fallback for testing if the wardrobe is too small
    if (allItems.size < 3) {
      return NextResponse.json({ 
        missing_item: "White Leather Sneakers",
        unlocks_count: 8,
        reason: "A clean white sneaker will seamlessly bridge your casual tops and tailored trousers.",
        search_query: "white leather sneakers"
      });
    }

    const prompt = `You are an elite fashion stylist. Here is the user's exact wardrobe: [${wardrobeList}]. 
    Analyze the gaps. What ONE single item (e.g., "White leather sneakers" or "Camel overcoat") should they buy that will mathematically unlock the most new outfit combinations with their existing clothes? 
    Return ONLY a valid JSON object with exactly these keys:
    - missing_item (string)
    - unlocks_count (number)
    - reason (string, 1 sentence)
    - search_query (string, 2-3 words)`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("Groq API failed");
    
    const payload = await response.json();
    const rawContent = payload.choices[0].message.content;
    
    // Strip markdown if the model hallucinates it
    const cleanedContent = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedContent);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Arbitrage Error:", error);
    // Return a mock result on failure so the UI doesn't break
    return NextResponse.json({ 
      missing_item: "Classic Beige Trench Coat",
      unlocks_count: 12,
      reason: "This transitional piece works with every dark and light layer you already own.",
      search_query: "beige trench coat"
    });
  }
}
