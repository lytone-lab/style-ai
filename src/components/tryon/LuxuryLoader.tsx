"use client";

export interface LoaderStage { key: string; label: string; }

export default function LuxuryLoader({ stages, progress }: { stages: LoaderStage[]; progress: number; }) {
  const pct = Math.max(0, Math.min(100, progress));
  const complete = pct >= 100;
  const activeIndex = complete ? stages.length : Math.min(stages.length - 1, Math.floor((pct / 100) * stages.length));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0E0E10] p-7">
      <style>{`
        @keyframes lux-sheen { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
        @keyframes lux-track { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @media (prefers-reduced-motion: reduce) { .lux-anim { animation: none !important; } }
      `}</style>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#B99A6B]">Virtual Studio</p>
          <h2 className="mt-1.5 text-[15px] font-medium text-[#E8E6E3]">Simulating Studio Preview</h2>
        </div>
        <span className="font-mono text-[13px] tabular-nums text-[#8B8B90]">{Math.round(pct).toString().padStart(2, "0")}%</span>
      </div>

      <div className="relative mt-5 h-[2px] w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8A7048] via-[#D8BE91] to-[#8A7048] bg-[length:200%_100%] transition-[width] duration-500 lux-anim"
          style={{ width: `${pct}%`, animation: "lux-track 2.6s linear infinite" }}
        />
        {!complete && <span aria-hidden className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent lux-anim" style={{ animation: "lux-sheen 1.9s ease-in-out infinite" }} />}
      </div>

      <ol className="mt-6 space-y-3">
        {stages.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage.key} className="flex items-center gap-3">
              <span className={["grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border text-[9px]", done ? "border-[#B99A6B] bg-[#B99A6B] text-[#121214]" : active ? "border-[#B99A6B]/70 text-[#B99A6B]" : "border-white/12 text-transparent"].join(" ")}>
                {done ? "✓" : active ? "•" : "·"}
              </span>
              <span className={["text-[12.5px] transition-colors", done ? "text-[#6E6E74] line-through" : active ? "text-[#E8E6E3]" : "text-[#55555A]"].join(" ")}>
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-[10.5px] leading-relaxed text-[#55555A]">
        Preview mode active. No generative models are invoked, and no cloud credits are consumed.
      </p>
    </div>
  );
}
