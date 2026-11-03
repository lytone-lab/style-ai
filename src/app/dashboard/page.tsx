"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function resolveImageUrl(raw: string | null | undefined, supabase: ReturnType<typeof createClient>): string {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return supabase.storage.from("outfits").getPublicUrl(raw).data.publicUrl ?? "";
}

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      // FIX: Filter by user_id to prevent data leaks
      const { data } = await supabase.from("scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      const processedScans = (data || []).map(scan => ({
        ...scan,
        image_url: resolveImageUrl(scan.image_url, supabase)
      }));
      
      setScans(processedScans);
      setIsLoading(false);
    };
    fetchScans();
  }, [router]);

  return (
    <main className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden relative">
      <header className="flex justify-between items-center px-6 py-6 border-b border-[#1A1A1A] shrink-0">
        <h1 className="font-serif text-[28px] tracking-tight">Style.AI</h1>
        <Link href="/closet" className="text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-white transition-colors">Closet →</Link>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <div className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#00FF66] mb-2">Your Feed</p>
          <h2 className="font-serif text-[36px] leading-[1.1]">Recent<br/>Looks.</h2>
        </div>

        {isLoading ? (
          // SKELETON LOADER (Doherty Threshold)
          <div className="flex flex-col gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden flex flex-col relative">
                <div className="relative aspect-[4/5] w-full bg-[#1A1A1A] overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent" />
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-3 w-20 bg-[#222] rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#333] to-transparent" />
                  </div>
                  <div className="h-6 w-3/4 bg-[#222] rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#333] to-transparent" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-7 w-24 bg-[#222] rounded-full" />
                    <div className="h-7 w-20 bg-[#222] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="border border-dashed border-[#333] rounded-3xl p-8 text-center mt-10">
            <p className="font-serif text-[20px] mb-2 text-[#CCC]">Your runway is empty.</p>
            <p className="text-[13px] text-[#888]">Upload your first fit to get AI styling.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden flex flex-col">
                <div className="relative aspect-[4/5] w-full bg-[#0A0A0A]">
                  {scan.image_url ? (
                    <Image src={scan.image_url} alt="Scan result" fill className="object-cover opacity-95" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">Image Unavailable</span>
                    </div>
                  )}
                  
                  {/* Von Restorff Effect: The score pops out */}
                  <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full shadow-lg">
                    <span className="text-[12px] font-black">{scan.harmony_score}/100</span>
                  </div>
                </div>
                
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66] mb-1">{scan.vibe}</p>
                  <h3 className="font-serif text-[22px] mb-3">{scan.style_archetype}</h3>
                  <div className="flex flex-wrap gap-2">
                    {scan.detected_items?.slice(0, 3).map((item: any, i: number) => {
                      const itemName = typeof item === 'string' ? item : item?.name || "Unknown";
                      return (
                        <span key={i} className="text-[11px] bg-[#222] text-[#CCC] px-3 py-1 rounded-full border border-[#333]">
                          {itemName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fitts's Law: Massive floating action button */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-10">
        <Link href="/analyze/outfit" className="flex items-center justify-center w-full h-[72px] bg-white text-black rounded-full font-black uppercase tracking-widest text-[15px] active:scale-[0.96] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          + Scan New Fit
        </Link>
      </div>
    </main>
  );
}
