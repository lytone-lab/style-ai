import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { SpotlightCard } from "@/components/spotlight-card";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#09090B] text-[#E8E6E3] selection:bg-[#B99A6B]/30 overflow-hidden font-sans">
      {/* Adding CSS keyframes for the Marquee and Gradient */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liquid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-liquid {
          background-size: 200% auto;
          animation: liquid 6s linear infinite;
        }
      `}</style>

      {/* Ambient Background Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#B99A6B]/40 to-transparent blur-[100px]" />
      </div>
      <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#4a5c6a]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-[#B99A6B]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative w-full px-6 py-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
        <Link href="/" className="text-[20px] font-semibold tracking-[0.1em] drop-shadow-md">
          STYLE<span className="text-[#B99A6B]">.</span>AI
        </Link>
        <Link 
          href="/dashboard" 
          className="text-[12px] uppercase tracking-[0.16em] text-[#8B8B90] hover:text-[#E8E6E3] transition-colors px-4 py-2 rounded-full hover:bg-white/5"
        >
          Open App
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 pt-10 text-center z-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#B99A6B] mb-8">
            Style Intelligence
          </p>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-medium tracking-tighter mb-8 leading-[1.05]">
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

      {/* Variation 2: Infinite Marquee */}
      <div className="relative w-full border-y border-white/5 bg-white/[0.01] py-4 mb-24 overflow-hidden z-10 flex">
        <div className="animate-marquee whitespace-nowrap flex gap-8 text-[11px] uppercase tracking-[0.3em] text-[#55555A]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span>Quiet Luxury</span> <span className="text-[#B99A6B]">✦</span>
              <span>Corporate Minimalist</span> <span className="text-[#B99A6B]">✦</span>
              <span>Old Money</span> <span className="text-[#B99A6B]">✦</span>
              <span>Elevated Casual</span> <span className="text-[#B99A6B]">✦</span>
              <span>Streetwear</span> <span className="text-[#B99A6B]">✦</span>
              <span>Avant Garde</span> <span className="text-[#B99A6B]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="relative px-6 pb-32 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-4">Three tools. One cohesive look.</h2>
            <p className="text-[#8B8B90] text-[15px] max-w-xl mx-auto">Everything you need to refine your personal style, powered by advanced vision models.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Variation 1: Spotlight Cards */}
            <SpotlightCard>
              <div className="h-12 w-12 rounded-2xl bg-[#121214] border border-white/10 flex items-center justify-center text-[#B99A6B] text-xl mb-6 shadow-inner">
                ◉
              </div>
              <h3 className="text-[18px] font-medium mb-3">Color Analysis</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Use your camera to instantly map your undertone and discover the palette that matches you.
              </p>
            </SpotlightCard>

            <SpotlightCard>
              <div className="h-12 w-12 rounded-2xl bg-[#121214] border border-white/10 flex items-center justify-center text-[#B99A6B] text-xl mb-6 shadow-inner">
                ✕
              </div>
              <h3 className="text-[18px] font-medium mb-3">Outfit Check</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Upload a photo and get instant AI feedback on harmony, occasion fit, and specific styling tweaks.
              </p>
            </SpotlightCard>

            <SpotlightCard>
              <div className="h-12 w-12 rounded-2xl bg-[#121214] border border-white/10 flex items-center justify-center text-[#B99A6B] text-xl mb-6 shadow-inner">
                ↗
              </div>
              <h3 className="text-[18px] font-medium mb-3">Virtual Studio</h3>
              <p className="text-[14px] text-[#7C7C82] leading-relaxed">
                Preview high-end corporate garments on your own silhouette before you buy.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#B99A6B]/10 border border-[#B99A6B]/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#B99A6B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B99A6B] animate-pulse" />
                Preview Mode Active
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      <footer className="relative px-6 py-10 border-t border-white/10 text-center z-10 bg-[#09090B]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#55555A]">
          Style AI · Personal style intelligence
        </p>
      </footer>
    </main>
  );
}
