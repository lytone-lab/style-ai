/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GARMENTS } from "@/lib/tryon/catalogue";
import type { Garment, TryOnPhase, TryOnResult } from "@/lib/tryon/types";

const STAGES = [
  { key: "ingest", label: "Reading portrait silhouette" },
  { key: "geometry", label: "Simulating garment geometry" },
  { key: "drape", label: "Preparing preview composite" },
  { key: "composite", label: "Finalizing demo layout" },
];

export default function VirtualStudioPage() {
  const [phase, setPhase] = useState<TryOnPhase>("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [garment, setGarment] = useState<Garment | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Canvas interaction state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "generating") {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

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
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("selfie", selfie);
      body.append("garmentId", garment.id);

      const res = await fetch("/api/try-on", { method: "POST", body });
      const data = await res.json();
      
      await new Promise(resolve => setTimeout(resolve, 4000));

      if (!res.ok) throw new Error(data.error || "Failed");

      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  };

  // ================= FULL SCREEN LOADING =================
  if (phase === "generating") {
    return (
      <main className="relative flex flex-col h-screen bg-[#000000] text-[#FFFFFF] items-center justify-center p-6">
        {previewUrl && (
          <Image src={previewUrl} alt="Blur" fill className="object-cover opacity-20 blur-xl" unoptimized />
        )}
        
        <div className="relative z-10 flex flex-col gap-6 w-full max-w-[280px]">
          <h2 className="text-[24px] font-black tracking-tighter text-center mb-4 text-[#FFFFFF]">Simulating...</h2>
          {STAGES.map((step, index) => {
            const isCompleted = index < loadingStep;
            const isActive = index === loadingStep;
            return (
              <div key={index} className={`flex items-center gap-4 transition-all duration-300 ${isCompleted ? "opacity-50" : isActive ? "opacity-100 scale-105" : "opacity-20"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 ${isCompleted ? "bg-[#00FF66] border-[#00FF66]" : isActive ? "border-[#FFFFFF]" : "border-[#333333]"}`}>
                  {isCompleted && <span className="text-[#000000] text-[16px] font-black">✓</span>}
                  {isActive && <span className="h-3 w-3 bg-[#FFFFFF] rounded-full animate-pulse" />}
                </div>
                <span className={`text-[14px] font-bold uppercase tracking-widest ${isCompleted ? "text-[#888888] line-through" : "text-[#FFFFFF]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  const isReady = Boolean(previewUrl && garment);

  // ================= MAIN PAGE =================
  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-[#222222] z-10 bg-[#000000]">
        <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">
          ← Back
        </Link>
        <span className="text-[14px] font-black uppercase tracking-tighter">Virtual Studio</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        <h1 className="text-[32px] font-black leading-[1.05] tracking-tighter mb-4">
          Preview your <br />garments.
        </h1>
        
        {/* Canvas Area */}
        <div
          onPointerDown={(e) => { 
            if (!previewUrl) return; 
            e.currentTarget.setPointerCapture(e.pointerId); 
            dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; 
          }}
          onPointerMove={(e) => { if (!dragRef.current) return; setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.x), y: dragRef.current.oy + (e.clientY - dragRef.current.y) }); }}
          onPointerUp={() => { dragRef.current = null; }}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-2 border-[#222222] bg-[#111111] touch-none mb-6 shrink-0 flex items-center justify-center"
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl} alt="Portrait" draggable={false}
                className="absolute left-1/2 top-1/2 max-h-none origin-center object-cover w-full h-full"
                style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}
              />
              {garment && (
                <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-40 transition-colors" style={{ backgroundColor: garment.swatch }} />
              )}
            </>
          ) : (
            <label className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#111111]">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={(e) => onPickSelfie(e.target.files?.[0] ?? null)} />
              <span className="text-[14px] font-bold uppercase tracking-widest text-[#555555] mb-2">Tap to upload portrait</span>
            </label>
          )}
        </div>

        {/* Controls */}
        {previewUrl && (
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Zoom</span>
            <input type="range" min={1} max={2.2} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#222222] accent-[#FFFFFF]" />
          </div>
        )}

        {/* Garment Carousel */}
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mb-3">Select Garment</p>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGarment(g)}
                className={`snap-start shrink-0 w-36 p-3 rounded-2xl border text-left transition-all ${
                  garment?.id === g.id 
                    ? "border-[#FFFFFF] bg-[#222222] ring-2 ring-[#FFFFFF] ring-offset-2 ring-offset-[#000000]" 
                    : "border-[#222222] bg-[#111111] opacity-70 hover:opacity-100"
                }`}
              >
                <div className="h-16 w-full rounded-lg mb-3" style={{ background: `linear-gradient(145deg, ${g.swatch} 0%, ${g.swatch}dd 55%, #0d0d0f 140%)` }} />
                <p className="text-[12px] font-bold text-[#FFFFFF] leading-tight mb-1 truncate">{g.name}</p>
                <p className="text-[10px] text-[#888888] uppercase tracking-wider">{g.brand}</p>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[12px] text-red-500 font-medium text-center mb-4">{error}</p>}
      </div>

      {/* Bottom Action Area */}
      <div className="px-6 pb-8 pt-4 shrink-0 bg-gradient-to-t from-black via-black to-transparent z-10">
        {phase === "result" ? (
          <div className="flex flex-col gap-3">
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#00FF66] mb-1">Preview Mode</p>
              <p className="text-[12px] text-[#888888] leading-relaxed">{result?.message}</p>
            </div>
            <button
              onClick={() => { setPhase("ready"); setResult(null); }}
              className="w-full flex items-center justify-center bg-[#111111] border border-[#222222] text-[#FFFFFF] h-[64px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[14px]"
            >
              Scan Another
            </button>
          </div>
        ) : (
          <button
            onClick={generate}
            disabled={!isReady}
            className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px] disabled:opacity-50"
          >
            {!previewUrl ? "Upload Portrait" : !garment ? "Select Garment" : "Simulate Studio"}
          </button>
        )}
      </div>

    </main>
  );
}
