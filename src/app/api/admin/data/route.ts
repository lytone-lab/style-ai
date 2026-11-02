import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ 
      error: "Unauthorized", 
      userEmail: user?.email || "Not logged in" 
    }, { status: 401 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [profiles, scans, waitlist] = await Promise.all([
    adminSupabase.from('profiles').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('scans').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('waitlist').select('*').order('created_at', { ascending: false })
  ]);

  return NextResponse.json({
    profiles: profiles.data || [],
    scans: scans.data || [],
    waitlist: waitlist.data || []
  });
}
