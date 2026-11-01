"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GarmentGrid from "@/components/tryon/GarmentGrid";
import LuxuryLoader, { type LoaderStage } from "@/components/tryon/LuxuryLoader";
import type { Garment, TryOnPhase, TryOnResult } from "@/lib/tryon/types";

const STAGES: LoaderStage[] = [
  { key: "ingest", label: "Reading portrait silhouette" },
  { key: "geometry", label: "Simulating garment geometry" },
  { key: "drape", label: "Preparing preview composite" },
  { key: "composite", label: "Finalizing demo layout" },
];

export default function TryOnPage() {
  const [phase, setPhase] = useState<TryOnPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [garment, setGarment] = useState<Garment | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (phase !== "generating") return;
    const id = window.setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(0.7, (92 - p) * 0.05) : p));
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

  const ready = Boolean(selfie && garment) && phase !== "generating";

  const onPickSelfie = useCallback((file: File | null) => {
    if (!file) return;
    setSelfie(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setResult(null);
    setError(null);
    setPhase("ready");
  }, []);

  const generate = async () => {
    if (!selfie || !garment) return;
    setPhase("generating");
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("selfie", selfie);
      body.append("garmentId", garment.id);

      const res = await fetch("/api/try-on", { method: "POST", body });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed");

      setProgress(100);
      window.setTimeout(() => {
        setResult(data);
        setPhase("result");
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#121214] px-4 pb-20 pt-10 text-[#E8E6E3] sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#B99A6B]">Style AI · Premium</p>
            <h1 className="mt-2 text-[22px] font-medium tracking-tight sm:text-[26px]">AI Virtual Studio</h1>
            <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[#7C7C82]">
              Fit premium corporate pieces to your portrait. Preview mode evaluates garment drape and tonal harmony.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="flex flex-col gap-4">
            <div
              onPointerDown={(e) => { 
                if (!previewUrl) return; // <--- FIX: Ignore drag if no image
                e.currentTarget.setPointerCapture(e.pointerId); 
                dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; 
              }}
              onPointerMove={(e) => { if (!dragRef.current) return; setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.x), y: dragRef.current.oy + (e.clientY - dragRef.current.y) }); }}
              onPointerUp={() => { dragRef.current = null; }}
              className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-white/8 bg-[#0C0C0E] touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "33.33% 25%" }} />

              {previewUrl ? (
                <img
                  src={previewUrl} alt="Portrait" draggable={false}
                  className="absolute left-1/2 top-1/2 max-h-none origin-center"
                  style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`, width: "100%" }}
                />
              ) : (
                <label className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-3">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={(e) => onPickSelfie(e.target.files?.[0] ?? null)} />
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 text-[#B99A6B]">+</span>
                  <span className="text-[13px] text-[#C9C7C4]">Upload portrait</span>
                </label>
              )}

              {garment && previewUrl && (
                <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-40 transition-colors" style={{ backgroundColor: garment.swatch }} />
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.015] px-4 py-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#6E6E74]">Zoom</span>
              <input type="range" min={1} max={2.2} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/12 accent-[#B99A6B]" />
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            {phase === "generating" ? (
              <LuxuryLoader stages={STAGES} progress={progress} />
            ) : (
              <>
                <GarmentGrid selectedId={garment?.id ?? null} onSelect={setGarment} disabled={phase === "generating"} />
                
                <div className="rounded-xl border border-white/8 bg-white/[0.015] p-4">
                  <button
                    onClick={generate}
                    disabled={!ready}
                    className="w-full rounded-lg bg-[#E8E6E3] py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#121214] transition-all hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#55555A]"
                  >
                    Run Studio Preview
                  </button>
                  {error && <p role="alert" className="mt-3 text-[11.5px] text-red-400/90">{error}</p>}
                </div>

                {phase === "result" && result && (
                  <div className="rounded-xl border border-[#B99A6B]/30 bg-[#B99A6B]/[0.05] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#B99A6B]">Preview Complete</p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-[#C9C7C4]">{result.message}</p>
                    <p className="mt-4 text-[10px] text-[#55555A] uppercase tracking-[0.1em]">No cloud credits were consumed.</p>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
