"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClosetItem = {
  name: string;
  wearCount: number;
  image: string;
  basePrice: number;
};

export default function ClosetPage() {
  const router = useRouter();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCloset = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from('scans')
        .select('detected_items, image_url')
        .order('created_at', { ascending: false });

      if (data) {
        const itemMap = new Map<string, ClosetItem>();
        
        data.forEach((scan) => {
          scan.detected_items.forEach((item: string) => {
            const normalizedName = item.trim().toLowerCase();
            if (itemMap.has(normalizedName)) {
              itemMap.get(normalizedName)!.wearCount += 1;
            } else {
              itemMap.set(normalizedName, {
                name: item,
                wearCount: 1,
                image: scan.image_url,
                basePrice: Math.floor(Math.random() * 80) + 40,
              });
            }
          });
        });

        setItems(Array.from(itemMap.values()));
      }
      setIsLoading(false);
    };
    fetchCloset();
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-screen bg-[#000000] text-[#FFFFFF]">
        <p className="text-[14px] font-bold uppercase tracking-widest text-[#888888] animate-pulse">Syncing Closet...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      <header className="flex justify-between items-center px-6 py-6 shrink-0 z-10">
        <span className="text-[22px] font-black tracking-tighter">STYLE.AI</span>
        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Back</Link>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="mb-8">
          <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-2">Your Closet.</h1>
          <p className="text-[14px] text-[#888888]">Every unique item you&apos;ve scanned, automatically cataloged.</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 text-center flex flex-col items-center mt-10">
            <p className="text-[15px] font-bold text-[#FFFFFF] mb-2">Your closet is empty.</p>
            <p className="text-[13px] text-[#888888]">Scan your first outfit to start building your digital wardrobe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, i) => {
              const cpw = (item.basePrice / item.wearCount).toFixed(2);
              return (
                <div key={i} className="relative aspect-[3/4] w-full rounded-[1.5rem] overflow-hidden bg-[#111111] border border-[#222222]">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />}
                  
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Wear Count Badge (Bottom Left) */}
                  <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-[#FFFFFF]">{item.wearCount} Wears</span>
                  </div>

                  {/* Item Name and Cost (Bottom Right) */}
                  <div className="absolute bottom-3 right-3 flex flex-col items-end">
                    <span className={`text-[12px] font-black ${Number(cpw) < 10 ? "text-[#00FF66]" : "text-[#FFFFFF]"}`}>
                      ${cpw}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#888888]">/wear</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
