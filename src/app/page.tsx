import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { ClayCard } from "@/components/spotlight-card";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#151518] text-[#E8E6E3] selection:bg-[#B99A6B]/30 overflow-hidden font-sans">
      <style>{`
        @keyframes liquid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-liquid {
          background-size: 200% auto;
          animation: liquid 6s linear infinite;
        }
      `}</style>

      <header className="relative w-full px-6 py-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
        <Link href="/" className="text-[20px] font-semibold tracking-[0.1em] drop-shadow-md">
          STYLE<span className="text-[#B99A6B]">.</span>AI
        </Link>
        <Link 
          href="/dashboard" 
          className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#8B8B90] transition-all px-5 py-2.5 rounded-2xl bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.3)] hover:text-[#E8E6E3] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.08),0_6px_15px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
        >
          Open App
        </Link>
      </header>

      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 text-center z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-8 px-4 py-1.5 rounded-full bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.3)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] font-medium">
              Style Intelligence
            </p>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-medium tracking-tighter mb-8 leading-[1.05] drop-shadow-2xl">
            Your personal <br className="hidden sm:block" />
            <span className="animate-liquid text-transparent bg-clip-text bg-gradient-to-r from-[#E8E6E3] via-[#B99A6B] to-[#E8E6E3]">
              AI stylist.
            </span>
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#8B8B90] mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Elevate your everyday style. Analyze your color profile, check outfit harmony, and preview premium garments in seconds.
          </p>

          <div className="relative mx-auto max-w-lg">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-32 pt-16 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-4 drop-shadow-md">Three tools. One cohesive look.</h2>
            <p className="text-[#8B8B90] text-[15px] max-w-xl mx-auto">Everything you need to refine your personal style, powered by advanced vision models.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ClayCard>
              <div className="h-14 w-14 rounded-2xl bg-[#151518] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center text-[#B99A6B] text-2xl mb-6">
                ◉
              </div>
              <h3 className="text-[18px] font-medium mb-3">Color Analysis</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Use your camera to instantly map your undertone and discover the palette that matches you.
              </p>
            </ClayCard>

            <ClayCard>
              <div className="h-14 w-14 rounded-2xl bg-[#151518] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center text-[#B99A6B] text-2xl mb-6">
                ✕
              </div>
              <h3 className="text-[18px] font-medium mb-3">Outfit Check</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Upload a photo and get instant AI feedback on harmony, occasion fit, and specific styling tweaks.
              </p>
            </ClayCard>

            <ClayCard>
              <div className="h-14 w-14 rounded-2xl bg-[#151518] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center text-[#B99A6B] text-2xl mb-6">
                ↗
              </div>
              <h3 className="text-[18px] font-medium mb-3">Virtual Studio</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Preview high-end corporate garments on your own silhouette before you buy.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#151518] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#B99A6B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B99A6B] animate-pulse shadow-[0_0_8px_#B99A6B]" />
                Preview Mode
              </div>
            </ClayCard>
          </div>
        </div>
      </section>

      <footer className="relative px-6 py-10 border-t border-white/5 text-center z-10 bg-[#121214]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#55555A]">
          Style AI · Personal style intelligence
        </p>
      </footer>
    </main>
  );
}
