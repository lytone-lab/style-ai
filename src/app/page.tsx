import Link from "next/link";

export default function MobileLandingPage() {
  return (
    <main className="relative flex flex-col h-[100dvh] bg-[#000000] text-[#FFFFFF] overflow-hidden selection:bg-[#FFFFFF] selection:text-[#000000]">
      
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 py-6 shrink-0 z-10">
        <span className="text-[22px] font-black tracking-tighter">STYLE.AI</span>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-4 overflow-y-auto z-10">
        
        {/* Massive Typography */}
        <h1 className="text-[56px] font-black leading-[0.9] tracking-tighter mb-5 mt-2">
          Your <br />
          personal <br />
          AI stylist.
        </h1>
        <p className="text-[16px] text-[#888888] font-medium max-w-[290px] leading-relaxed mb-10">
          Snap a photo to instantly analyze your outfit's harmony, silhouette, and color profile.
        </p>

        {/* Unified Grid System with Heavy Rounding */}
        <div className="flex flex-col gap-3 mb-auto">
          
          {/* Card 1: Color Profile */}
          <Link href="/analyze/color" className="bg-[#111111] border border-[#222222] rounded-[2rem] p-6 flex items-center justify-between active:scale-[0.98] transition-transform">
            <p className="text-[17px] font-bold text-[#FFFFFF]">Color Profile</p>
            <div className="flex gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#8B4513]"></div>
              <div className="w-6 h-6 rounded-full bg-[#556B2F]"></div>
              <div className="w-6 h-6 rounded-full bg-[#D2691E]"></div>
              <div className="w-6 h-6 rounded-full bg-[#2F4F4F]"></div>
            </div>
          </Link>

          {/* Card 2: Outfit Harmony */}
          <Link href="/analyze/outfit" className="bg-[#111111] border border-[#222222] rounded-[2rem] p-6 block active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-end mb-4">
              <p className="text-[17px] font-bold text-[#FFFFFF]">Outfit Harmony</p>
              <span className="text-[32px] font-black text-[#00FF66] leading-none tracking-tighter">92<span className="text-[16px] text-[#888888]">%</span></span>
            </div>
            <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
              <div className="h-full bg-[#00FF66] w-[92%] rounded-full"></div>
            </div>
          </Link>

          {/* Card 3: Virtual Studio */}
          <Link href="/dashboard/try-on" className="bg-[#111111] border border-[#222222] rounded-[2rem] p-6 flex items-center justify-between active:scale-[0.98] transition-transform">
            <p className="text-[17px] font-bold text-[#FFFFFF]">Virtual Studio</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888] border border-[#333333] px-3 py-1.5 rounded-full">Preview</span>
          </Link>

        </div>
      </div>

      {/* Bottom Action Zone - Massive Pill Button */}
      <div className="px-6 pb-12 pt-4 shrink-0 z-10 bg-gradient-to-t from-black via-black to-transparent">
        <Link 
          href="/analyze/outfit"
          className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[76px] rounded-full active:scale-[0.96] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <span className="text-[18px] font-black uppercase tracking-[0.1em]">Scan Outfit</span>
        </Link>
      </div>

    </main>
  );
}
