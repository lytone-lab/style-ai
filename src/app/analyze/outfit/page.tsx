"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";

type OutfitCheckResult = {
  detected_items: string[];
  dominant_colors: string[];
  harmony_score: number;
  occasion_fit: string;
  three_fixes: [string, string, string];
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const LOADING_STEPS = [
  "Isolating garments & layers",
  "Detecting fabrics & textures",
  "Mapping color distribution",
  "Calculating harmony score",
];

function isOutfitCheckResult(value: unknown): value is OutfitCheckResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    Array.isArray(result.detected_items) && result.detected_items.every((item) => typeof item === "string") &&
    Array.isArray(result.dominant_colors) && result.dominant_colors.every((color) => typeof color === "string") &&
    typeof result.harmony_score === "number" && Number.isFinite(result.harmony_score) && result.harmony_score >= 0 && result.harmony_score <= 100 &&
    typeof result.occasion_fit === "string" &&
    Array.isArray(result.three_fixes) && result.three_fixes.length === 3 && result.three_fixes.every((fix) => typeof fix === "string")
  );
}

export default function OutfitAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitCheckResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const selectFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setErrorMessage(null); setResult(null);
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) { setFile(null); setErrorMessage("Choose a JPEG, PNG, or WebP image."); return; }
    if (selectedFile.size > MAX_FILE_BYTES) { setFile(null); setErrorMessage("Choose an image smaller than 4 MB."); return; }
    setFile(selectedFile);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => { selectFile(event.target.files?.[0]); event.target.value = ""; };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); selectFile(event.dataTransfer.files[0]); };
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };

  const analyzeOutfit = async () => {
    if (!file || isLoading) return;
    setIsLoading(true); setErrorMessage(null); setResult(null);
    const formData = new FormData(); formData.append("image", file);
    
    try {
      const response = await fetch("/api/outfit-check", { method: "POST", body: formData });
      const payload: unknown = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 4000)); 

      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "We couldn't analyze that outfit. Please try again.";
        throw new Error(message);
      }
      if (!isOutfitCheckResult(payload)) throw new Error("The outfit analysis returned an unexpected response.");
      setResult(payload);
      
      const newScan = {
        id: Date.now().toString(),
        title: payload.detected_items.slice(0, 2).join(" + "),
        score: payload.harmony_score,
        colors: payload.dominant_colors.slice(0, 3),
        date: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem("style_ai_history") || "[]");
      localStorage.setItem("style_ai_history", JSON.stringify([newScan, ...existing].slice(0, 20)));

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setIsLoading(false); }
  };

  // =========================================================================
  // EARLY RETURN: FULL SCREEN LOADING STATE (No Overlays, No Blur Bugs)
  // =========================================================================
  if (isLoading) {
    return (
      <main className="relative flex flex-col h-screen bg-[#000000] text-[#FFFFFF] items-center justify-center p-6">
        {/* Optional: Add a blurred background of the user's photo */}
        {previewUrl && (
          <Image src={previewUrl} alt="Blur" fill className="object-cover opacity-20 blur-xl" unoptimized />
        )}
        
        <div className="relative z-10 flex flex-col gap-6 w-full max-w-[280px]">
          <h2 className="text-[24px] font-black tracking-tighter text-center mb-4 text-[#FFFFFF]">Analyzing...</h2>
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = index < loadingStep;
            const isActive = index === loadingStep;
            return (
              <div key={index} className={`flex items-center gap-4 transition-all duration-300 ${isCompleted ? "opacity-50" : isActive ? "opacity-100 scale-105" : "opacity-20"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 ${isCompleted ? "bg-[#00FF66] border-[#00FF66]" : isActive ? "border-[#FFFFFF]" : "border-[#333333]"}`}>
                  {isCompleted && <span className="text-[#000000] text-[16px] font-black">✓</span>}
                  {isActive && <span className="h-3 w-3 bg-[#FFFFFF] rounded-full animate-pulse" />}
                </div>
                <span className={`text-[14px] font-bold uppercase tracking-widest ${isCompleted ? "text-[#888888] line-through" : "text-[#FFFFFF]"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // =========================================================================
  // NORMAL PAGE RENDER
  // =========================================================================
  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-[#222222] z-10 bg-[#000000]">
        <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">
          ← Back
        </Link>
        <span className="text-[14px] font-black uppercase tracking-tighter">Outfit Check</span>
        <div className="w-10"></div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        {!result ? (
          <div className="flex flex-col h-full">
            <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-3">
              Scan your <br />fit.
            </h1>
            <p className="text-[14px] text-[#888888] mb-8 leading-relaxed">
              Drop a photo of your outfit below. Our AI will analyze the silhouette, harmony, and occasion fit.
            </p>

            <div
              className={`relative flex-1 w-full overflow-hidden rounded-[2rem] bg-[#111111] border-2 transition-all ${isDragging ? "border-[#FFFFFF]" : "border-[#222222] border-dashed"} flex flex-col items-center justify-center`}
              onDragOver={handleDragOver} onDragEnter={handleDragOver}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false); }}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <Image className="object-cover w-full h-full absolute inset-0" src={previewUrl} alt="Outfit preview" width={720} height={900} unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <span className="text-4xl text-[#FFFFFF] mb-2">+</span>
                  <span className="text-[14px] font-bold uppercase tracking-widest text-[#FFFFFF]">Tap to Upload</span>
                  <span className="text-[12px] text-[#888888]">JPEG, PNG or WebP</span>
                </div>
              )}
              <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" type="file" accept="image/*" onChange={handleFileInput} />
            </div>

            {errorMessage && <p className="mt-4 text-[12px] text-red-500 font-medium text-center" role="alert">{errorMessage}</p>}
          </div>
        ) : (
          <div className="flex flex-col h-full animate-slide-up">
            <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-6">
              Analysis <br />complete.
            </h1>
            
            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 flex flex-col items-center justify-center mb-4">
              <div className="relative h-40 w-40 rounded-full flex items-center justify-center mb-4"
                   style={{ background: `conic-gradient(#FFFFFF ${result.harmony_score}%, #222222 0)` }}>
                <div className="absolute inset-2 bg-[#111111] rounded-full flex flex-col items-center justify-center">
                  <strong className="text-5xl font-black tracking-tighter">{result.harmony_score}</strong>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mt-1">Harmony</span>
                </div>
              </div>
              <p className="text-[13px] text-[#888888] text-center max-w-[200px]">{result.occasion_fit}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-3">Pieces</p>
                <ul className="space-y-1">
                  {result.detected_items.map((item, i) => <li key={i} className="text-[13px] font-medium capitalize text-[#FFFFFF]">{item}</li>)}
                </ul>
              </div>
              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-3">Colors</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.dominant_colors.map((color, i) => <span key={i} className="px-2 py-1 bg-[#222222] text-[10px] font-bold uppercase tracking-wider rounded-md text-[#FFFFFF]">{color}</span>)}
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-3">Three Fixes</p>
              <div className="space-y-3">
                {result.three_fixes.map((fix, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[12px] font-black text-[#FFFFFF]">0{i+1}</span>
                    <p className="text-[13px] text-[#888888] leading-relaxed">{fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="px-6 pb-8 pt-4 shrink-0 bg-gradient-to-t from-black via-black to-transparent z-10 relative">
        {!result ? (
          <button
            onClick={analyzeOutfit}
            disabled={!file}
            className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px] disabled:opacity-50"
          >
            Analyze Outfit
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center bg-[#111111] border border-[#222222] text-[#FFFFFF] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px]"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
