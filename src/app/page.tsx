import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#121214] text-[#E8E6E3] selection:bg-[#B99A6B]/30">
      {/* Header */}
      <header className="absolute top-0 w-full px-6 py-6 flex justify-between items-center z-10">
        <Link href="/" className="text-[18px] font-semibold tracking-[0.1em]">
          STYLE<span className="text-[#B99A6B]">.</span>AI
        </Link>
        <Link 
          href="/dashboard" 
          className="text-[12px] uppercase tracking-[0.16em] text-[#8B8B90] hover:text-[#E8E6E3] transition-colors"
        >
          Open App
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 pt-20 text-center">
        {/* Background Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B99A6B]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-6">
            Style Intelligence
          </p>
          <h1 className="text-5xl sm:text-7xl font-medium tracking-tight mb-6 leading-[1.1]">
            Your personal <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8E6E3] to-[#8B8B90]">
              AI stylist.
            </span>
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#8B8B90] mb-10 max-w-xl mx-auto leading-relaxed">
            Elevate your everyday style. Analyze your color profile, check outfit harmony, and preview premium garments in seconds.
          </p>

          <div className="max-w-md mx-auto bg-white/[0.02] border border-white/10 rounded-2xl p-2 backdrop-blur-sm">
            <WaitlistForm />
          </div>
          <p className="text-[11px] text-[#55555A] mt-4">
            Join the private beta. No spam, ever.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 border-t border-white/5 bg-[#0C0C0E]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mb-4">Three tools. One cohesive look.</h2>
            <p className="text-[#8B8B90] text-[14px]">Everything you need to refine your personal style.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="border border-white/8 bg-white/[0.015] p-8 rounded-2xl hover:bg-white/[0.03] transition-colors">
              <div className="h-10 w-10 rounded-full border border-[#B99A6B]/30 flex items-center justify-center text-[#B99A6B] mb-6">
                ◉
              </div>
              <h3 className="text-[16px] font-medium mb-2">Color Analysis</h3>
              <p className="text-[13px] text-[#7C7C82] leading-relaxed">
                Use your camera to instantly map your undertone and discover the palette that matches you.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-white/8 bg-white/[0.015] p-8 rounded-2xl hover:bg-white/[0.03] transition-colors">
              <div className="h-10 w-10 rounded-full border border-[#B99A6B]/30 flex items-center justify-center text-[#B99A6B] mb-6">
                ✕
              </div>
              <h3 className="text-[16px] font-medium mb-2">Outfit Check</h3>
              <p className="text-[13px] text-[#7C7C82] leading-relaxed">
                Upload a photo and get instant AI feedback on harmony, occasion fit, and specific styling tweaks.
              </p>
            </div>

            {/* Card 3 */}
            <div className="border border-white/8 bg-white/[0.015] p-8 rounded-2xl hover:bg-white/[0.03] transition-colors">
              <div className="h-10 w-10 rounded-full border border-[#B99A6B]/30 flex items-center justify-center text-[#B99A6B] mb-6">
                ↗
              </div>
              <h3 className="text-[16px] font-medium mb-2">Virtual Studio</h3>
              <p className="text-[13px] text-[#7C7C82] leading-relaxed">
                Preview high-end corporate garments on your own silhouette before you buy. 
              </p>
              <span className="inline-block mt-4 text-[10px] uppercase tracking-[0.16em] text-[#B99A6B]">
                Preview Mode Active
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-white/5 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#55555A]">
          Style AI · Personal style intelligence
        </p>
      </footer>
    </main>
  );
}
