"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ScanRecord = {
  id: string;
  title: string;
  score: number;
  colors: string[];
  date: string;
};

export default function MobileDashboardPage() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("style_ai_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const latestScore = history.length > 0 ? history[0].score : 0;
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = history.length > 0 ? circumference - (latestScore / 100) * circumference : circumference;

  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      
      <header className="flex justify-between items-center px-6 py-6 shrink-0 z-10">
        <span className="text-[22px] font-black tracking-tighter">STYLE.AI</span>
        <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888] hover:text-[#FFFFFF] transition-colors">
          Home
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        
        <div className="flex flex-col items-center justify-center mt-4 mb-10 shrink-0">
          <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#222222" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r={radius} fill="none" stroke="#00FF66" strokeWidth="8" 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[13px] font-bold uppercase tracking-widest text-[#888888] mb-1">Harmony</span>
              <strong className="text-[72px] font-black leading-none tracking-tighter">{latestScore}</strong>
              <span className="text-[13px] font-bold text-[#555555] mt-1">/ 100</span>
            </div>
          </div>
          <p className="text-[13px] font-bold text-[#888888] uppercase tracking-widest">Today's Style Pulse</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[18px] font-bold tracking-tight">Recent Scans</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">{history.length} items</span>
          </div>

          {history.length === 0 ? (
            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 text-center flex flex-col items-center">
              <p className="text-[15px] font-bold text-[#FFFFFF] mb-2">No outfits scanned yet.</p>
              <p className="text-[13px] text-[#888888]">Tap the + button below to start building your digital wardrobe.</p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="bg-[#111111] border border-[#222222] rounded-[1.5rem] p-5 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[15px] font-bold text-[#FFFFFF] truncate capitalize mb-1">{entry.title}</p>
                  <div className="flex gap-1.5 mt-2">
                    {entry.colors.map((c, i) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-full border border-[#333]" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-[22px] font-black text-[#00FF66] tracking-tighter leading-none">{entry.score}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#555555] mt-1">Score</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 h-[88px] bg-[#000000] border-t border-[#222222] flex items-center justify-around px-8 relative">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#FFFFFF]">◉</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFFFFF]">Home</span>
        </Link>
        
        <Link 
          href="/analyze/outfit" 
          className="absolute -top-8 left-1/2 -translate-x-1/2 h-[68px] w-[68px] bg-[#FFFFFF] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform"
        >
          <span className="text-[32px] font-black text-[#000000]">+</span>
        </Link>

        <Link href="/dashboard/try-on" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#888888]">✦</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#888888]">Studio</span>
        </Link>
      </div>

    </main>
  );
}
