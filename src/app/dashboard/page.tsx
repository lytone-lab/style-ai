"use client";

import Link from "next/link";

export default function MobileDashboardPage() {
  const latestScore = 92;
  
  // SVG math for a perfect ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (latestScore / 100) * circumference;

  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 shrink-0 z-10">
        <span className="text-[22px] font-black tracking-tighter">STYLE.AI</span>
        <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888] hover:text-[#FFFFFF] transition-colors">
          Home
        </Link>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        
        {/* Massive SVG Ring */}
        <div className="flex flex-col items-center justify-center mt-4 mb-10 shrink-0">
          <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle 
                cx="50" cy="50" r={radius} 
                fill="none" stroke="#222222" strokeWidth="8" 
              />
              {/* Animated progress */}
              <circle 
                cx="50" cy="50" r={radius} 
                fill="none" stroke="#00FF66" strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Inner Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[13px] font-bold uppercase tracking-widest text-[#888888] mb-1">Harmony</span>
              <strong className="text-[72px] font-black leading-none tracking-tighter">{latestScore}</strong>
              <span className="text-[13px] font-bold text-[#555555] mt-1">/ 100</span>
            </div>
          </div>
          <p className="text-[13px] font-bold text-[#888888] uppercase tracking-widest">Today's Style Pulse</p>
        </div>

        {/* History List */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[18px] font-bold tracking-tight">Recent Scans</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">0 items</span>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 text-center flex flex-col items-center">
            <p className="text-[15px] font-bold text-[#FFFFFF] mb-2">No outfits scanned yet.</p>
            <p className="text-[13px] text-[#888888]">Tap the scan button below to start building your digital wardrobe.</p>
          </div>
        </div>
      </div>

      {/* Bottom Nav (Flex child, locked to bottom) */}
      <div className="shrink-0 h-[88px] bg-[#000000] border-t border-[#222222] flex items-center justify-around px-8 relative">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-[20px] text-[#FFFFFF]">◉</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFFFFF]">Home</span>
        </Link>
        
        {/* Floating Action Button */}
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
