"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClosetItem = {
  id: string;
  name: string;
  wears: number;
  cpw: number;
  image: string;
};

export default function ClosetPage() {
  const router = useRouter();
  const [cleanClosetData, setCleanClosetData] = useState<ClosetItem[]>([]);
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
        const itemMap = new Map<string, { name: string; totalWears: number; image: string; basePrice: number }>();

        data.forEach((scan) => {
          scan.detected_items.forEach((rawItem: string) => {
            // Normalize string
            const normalizedName = rawItem.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();

            if (itemMap.has(normalizedName)) {
              const existing = itemMap.get(normalizedName)!;
              itemMap.set(normalizedName, {
                ...existing,
                totalWears: existing.totalWears + 1,
                image: existing.image || scan.image_url,
              });
            } else {
              itemMap.set(normalizedName, {
                name: rawItem,
                totalWears: 1,
                image: scan.image_url,
                basePrice: Math.floor(Math.random() * 80) + 40,
              });
            }
          });
        });

        const finalData = Array.from(itemMap.entries()).map(([key, data]) => ({
          id: key,
          name: data.name,
          wears: data.totalWears,
          cpw: data.basePrice / data.totalWears,
          image: data.image
        }));

        setCleanClosetData(finalData);
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
      <header className="flex justify-between items-center px-6 py-6 shrink-0 z-10 border-b border-[#1A1A1A]">
        <span className="text-[22px] font-black tracking-tighter">STYLE.AI</span>
        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888888] hover:text-[#FFFFFF] transition-colors">Back</Link>
      </header>

      {/* strict padding on the main scroll container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-2">Your Closet.</h1>
          <p className="text-[14px] text-neutral-400 font-medium">Every unique item you&apos;ve scanned.</p>
        </div>

        {cleanClosetData.length === 0 ? (
          <div className="bg-[#0B0B0B] border border-[#1A1A1A] rounded-[2rem] p-8 text-center flex flex-col items-center mt-10">
            <p className="text-[15px] font-bold text-[#FFFFFF] mb-2">Your closet is empty.</p>
            <p className="text-[13px] text-neutral-400">Scan your first outfit to start building your digital wardrobe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full">
            {cleanClosetData.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col bg-[#0B0B0B] border border-[#1A1A1A] rounded-2xl overflow-hidden w-full"
              >
                {/* Fixed Image Container */}
                <div className="relative h-40 w-full bg-[#000000] shrink-0">
                  {item.image && (
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      fill 
                      className="object-cover opacity-90" 
                      unoptimized 
                    />
                  )}
                </div>

                {/* Solid Text Container underneath */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-3">
                  <h3 className="text-[12px] font-bold tracking-tight text-white leading-snug line-clamp-2">
                    {item.name}
                  </h3>

                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#00FF66]">
                        {item.wears} {item.wears === 1 ? 'Wear' : 'Wears'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[12px] font-black text-white">${item.cpw.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
