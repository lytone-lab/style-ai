"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClosetItem = { id: string; name: string; wears: number; image: string; };
type ClosetGroup = { key: string; image: string; items: ClosetItem[]; };

function resolveImageUrl(raw: string | null | undefined, supabase: ReturnType<typeof createClient>): string {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return supabase.storage.from("outfits").getPublicUrl(raw).data.publicUrl ?? "";
}

function normalizeItems(rawItems: any, fallbackImage: string, supabase: ReturnType<typeof createClient>) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item) => {
    if (typeof item === "string") return { name: item, image: fallbackImage };
    if (typeof item === "object" && item !== null && "name" in item) {
      return { name: item.name, image: resolveImageUrl(item.image_url, supabase) || fallbackImage };
    }
    return { name: "Unknown", image: fallbackImage };
  });
}

// FAIL-SAFE IMAGE COMPONENT
function SafeImage({ src, alt, className, sizes }: { src: string; alt: string; className?: string; sizes?: string }) {
  const [broken, setBroken] = useState(false);
  
  if (!src || broken) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
        <span className="text-[10px] text-[#666] font-bold uppercase tracking-widest">No Image</span>
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={alt} 
      fill 
      unoptimized 
      sizes={sizes || "100vw"} 
      className={className || "object-cover"} 
      onError={() => setBroken(true)} 
    />
  );
}

export default function ClosetPage() {
  const router = useRouter();
  const [cleanClosetData, setCleanClosetData] = useState<ClosetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCloset = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase.from("scans")
        .select("detected_items, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const itemMap = new Map<string, { name: string; totalWears: number; image: string }>();
        data.forEach((scan) => {
          const items = normalizeItems(scan.detected_items, resolveImageUrl(scan.image_url, supabase), supabase);
          items.forEach((item) => {
            if (!item.name || !item.name.trim()) return;
            const normalizedName = item.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
            if (itemMap.has(normalizedName)) {
              const existing = itemMap.get(normalizedName)!;
              itemMap.set(normalizedName, { ...existing, totalWears: existing.totalWears + 1, image: existing.image || item.image });
            } else {
              itemMap.set(normalizedName, { name: item.name, totalWears: 1, image: item.image });
            }
          });
        });
        
        const finalData = Array.from(itemMap.entries()).map(([key, d]) => ({ 
          id: key, name: d.name, wears: d.totalWears, image: d.image 
        }));
        
        finalData.sort((a, b) => b.wears - a.wears);
        setCleanClosetData(finalData);
      }
      setIsLoading(false);
    };
    fetchCloset();
  }, [router]);

  const groups = useMemo<ClosetGroup[]>(() => {
    const byImage = new Map<string, ClosetItem[]>();
    const orphans: ClosetItem[] = [];
    for (const item of cleanClosetData) {
      if (!item.image) { orphans.push(item); continue; }
      const bucket = byImage.get(item.image);
      if (bucket) bucket.push(item);
      else byImage.set(item.image, [item]);
    }
    const out: ClosetGroup[] = [];
    for (const [image, items] of byImage) out.push({ key: image, image, items });
    for (const item of orphans) out.push({ key: `noimg-${item.id}`, image: "", items: [item] });
    return out;
  }, [cleanClosetData]);

  if (isLoading) {
    return (
      <main className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden">
        <header className="flex justify-between items-center px-6 py-6 border-b border-[#1A1A1A] shrink-0">
          <h1 className="font-serif text-[28px] tracking-tight">Closet.</h1>
        </header>
        <div className="flex-1 px-5 py-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 row-span-2 aspect-[3/4] bg-[#111] border border-[#222] rounded-3xl relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent" />
            </div>
            <div className="aspect-square bg-[#111] border border-[#222] rounded-2xl relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent" />
            </div>
            <div className="aspect-square bg-[#111] border border-[#222] rounded-2xl relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (groups.length === 0) {
    return (
      <main className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden">
         <header className="flex justify-between items-center px-6 py-6 border-b border-[#1A1A1A] shrink-0">
          <h1 className="font-serif text-[28px] tracking-tight">Closet.</h1>
          <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-white">Back</Link>
        </header>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <p className="font-serif text-[24px] mb-2 text-[#CCC]">Wardrobe empty.</p>
            <Link href="/analyze/outfit" className="text-[13px] text-[#00FF66] underline underline-offset-4">Scan your first item</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden">
      <header className="flex justify-between items-center px-6 py-6 shrink-0 border-b border-[#1A1A1A]">
        <h1 className="font-serif text-[28px] tracking-tight">Closet.</h1>
        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-white">Back</Link>
      </header>
      
      <div className="flex-1 overflow-y-auto px-5 py-8 pb-24">
        <div className="grid grid-cols-2 gap-4">
          
          {/* HERO DROP CAP */}
          <div className="col-span-1 row-span-2 flex flex-col bg-[#111] border border-[#222] rounded-3xl overflow-hidden h-full">
            <div className="relative flex-1 w-full bg-[#0A0A0A]">
              <SafeImage 
                src={groups[0].image} 
                alt={groups[0].items[0]?.name || "Hero item"} 
                sizes="(max-width: 448px) 45vw, 220px" 
                className="object-cover object-top"
              />
              <div className="absolute top-3 left-3 bg-[#00FF66] text-black px-2 py-1 rounded-md">
                <span className="text-[9px] font-black uppercase tracking-wider">Top Item</span>
              </div>
              {groups[0].items.length > 1 && (
                <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-[#333]">
                  +{groups[0].items.length - 1}
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-1 shrink-0 bg-[#111] relative z-10">
              <h3 className="text-[14px] font-bold text-white leading-tight line-clamp-2">{groups[0].items[0]?.name}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#888]">
                {groups[0].items[0]?.wears} Wears
              </span>
            </div>
          </div>

          {/* THE REST */}
          {groups.slice(1).map((group) => (
            <div key={group.key} className="col-span-1 flex flex-col bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
              <div className="relative w-full aspect-square bg-[#0A0A0A]">
                <SafeImage 
                  src={group.image} 
                  alt={group.items[0]?.name || "Clothing item"} 
                  sizes="(max-width: 448px) 45vw, 220px" 
                  className="object-cover"
                />
                {group.items.length > 1 && (
                  <span className="absolute top-2 right-2 bg-black/80 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-[#333]">
                    +{group.items.length - 1}
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 bg-[#111] relative z-10">
                <h3 className="text-[12px] font-bold text-white line-clamp-1">{group.items[0]?.name}</h3>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#888]">
                  {group.items[0]?.wears} {group.items[0]?.wears === 1 ? "Wear" : "Wears"}
                </span>
              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}
