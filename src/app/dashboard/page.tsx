"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ScanRecord = {
  id: string;
  harmony_score: number;
  detected_items: string[];
  image_url: string;
  created_at: string;
};

type ArbitrageResult = {
  missing_item: string;
  unlocks_count: number;
  reason: string;
  search_query: string;
};

export default function MobileDashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [arbitrage, setArbitrage] = useState<ArbitrageResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setHistory(data);
      setIsLoading(false);

      if (data && data.length > 0) {
        try {
          const res = await fetch("/api/arbitrage");
          const resData = await res.json();
          if (res.ok && resData.missing_item) setArbitrage(resData);
        } catch (e) { console.error(e); }
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const latestScore = history.length > 0 ? history[0].harmony_score : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = history.length > 0 ? circumference - (latestScore / 100) * circumference : circumference;

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
        <button onClick={handleLogout} className="text-[11px] font-bold uppercase tracking-widest text-[#888888] hover:text-[#FFFFFF]">Log Out</button>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
        
        <div className="flex flex-col items-center justify-center mt-4 mb-10 shrink-0">
          <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#222222" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#00FF66" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[13px] font-bold uppercase tracking-widest text-[#888888] mb-1">Harmony</span>
              <strong className="text-[72px] font-black leading-none tracking-tighter">{latestScore}</strong>
              <span className="text-[13px] font-bold text-[#555555] mt-1">/ 100</span>
            </div>
          </div>
          <p className="text-[13px] font-bold text-[#888888] uppercase tracking-widest">Today&apos;s Style Pulse</p>
        </div>

        {/* Redesigned Arbitrage Card */}
        {arbitrage && (
          <div className="mb-10 bg-[#111111] border border-[#222222] rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,255,102,0.05)]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00FF66] via-[#00FF66]/50 to-transparent"></div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-[#00FF66] animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66]">Missing Link Detected</p>
            </div>

            <h3 className="text-[26px] font-black tracking-tighter leading-none mb-3 capitalize">Buy {arbitrage.missing_item}</h3>
            <p className="text-[14px] text-[#888888] leading-relaxed mb-6">{arbitrage.reason}</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-[#000000] border border-[#222222] rounded-xl p-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Combinations Unlocked</span>
                <span className="text-[18px] font-black text-[#FFFFFF]">{arbitrage.unlocks_count}</span>
              </div>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(arbitrage.search_query)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center text-[12px] font-black uppercase tracking-widest text-[#000000] bg-[#FFFFFF] h-[56px] rounded-full hover:bg-[#E0E0E0] active:scale-[0.98] transition-all">
                Shop This Item ↗
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[18px] font-bold tracking-tight">Recent Scans</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">{history.length} items</span>
          </div>

          {history.length === 0 ? (
            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 text-center flex flex-col items-center">
              <p className="text-[15px] font-bold text-[#FFFFFF] mb-2">No outfits scanned yet.</p>
              <p className="text-[13px] text-[#888888]">Tap the + button below to start building your cloud wardrobe.</p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="bg-[#111111] border border-[#222222] rounded-[1.5rem] p-4 flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-[#222222] shrink-0">
                  {entry.image_url && <Image src={entry.image_url} alt="Scan" fill className="object-cover" unoptimized />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#FFFFFF] truncate capitalize">{entry.detected_items.slice(0, 2).join(" + ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[18px] font-black text-[#00FF66] tracking-tighter">{entry.harmony_score}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5-Column Grid for Perfect Spacing */}
      <div className="shrink-0 h-[88px] bg-[#000000] border-t border-[#222222] grid grid-cols-5 items-center relative">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#FFFFFF]">◉</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFFFFF]">Home</span>
        </Link>
        
        <Link href="/closet" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#888888]">👕</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">Closet</span>
        </Link>

        {/* Empty column for the floating + button */}
        <div className="w-full h-full"></div>

        <Link href="/dashboard/try-on" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#888888]">✦</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">Studio</span>
        </Link>

        <Link href="/admin" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#888888]">⚙</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">Admin</span>
        </Link>

        <Link href="/analyze/outfit" className="absolute -top-5 left-1/2 -translate-x-1/2 h-[54px] w-[54px] bg-[#FFFFFF] rounded-[1.2rem] flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform">
          <span className="text-[28px] font-black text-[#000000] font-sans font-light mb-1">+</span>
        </Link>
      </div>
    </main>
  );
}
