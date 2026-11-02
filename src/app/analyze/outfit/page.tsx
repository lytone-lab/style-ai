"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, CSSProperties, DragEvent, useEffect, useState } from "react";

type OutfitCheckResult = {
  detected_items: string[];
  dominant_colors: string[];
  harmony_score: number;
  occasion_fit: string;
  three_fixes: [string, string, string];
};

const LOADING_MESSAGES = ["Scanning colors...", "Checking contrast harmony...", "Writing styling tips..."];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!isLoading) { setLoadingIndex(0); return; }
    const intervalId = window.setInterval(() => { setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length); }, 1700);
    return () => window.clearInterval(intervalId);
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
      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "We couldn't analyze that outfit. Please try again.";
        throw new Error(message);
      }
      if (!isOutfitCheckResult(payload)) throw new Error("The outfit analysis returned an unexpected response.");
      setResult(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setIsLoading(false); }
  };

  const scoreStyle = result ? ({ "--score": `${result.harmony_score}%` } as CSSProperties) : undefined;

  return (
    <main className="min-h-screen bg-[#151518] px-6 py-12 text-[#E8E6E3] selection:bg-[#B99A6B]/30">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex justify-between items-center">
          <Link href="/" className="text-[20px] font-semibold tracking-[0.1em] drop-shadow-md">
            STYLE<span className="text-[#B99A6B]">.</span>AI
          </Link>
          <Link href="/analyze/color" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#8B8B90] transition-all px-5 py-2.5 rounded-2xl bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.3)] hover:text-[#E8E6E3]">
            Color analysis ↗
          </Link>
        </header>

        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-4">Your Outfit Check</p>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">A second opinion, <br/><span className="italic text-[#B99A6B]">with style.</span></h1>
          <p className="text-[15px] text-[#8B8B90] leading-relaxed">
            Share a look and get thoughtful, clothing-focused notes on color, harmony, and easy ways to make it yours.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Card */}
          <div className="relative rounded-[2rem] bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_16px_32px_rgba(0,0,0,0.4)] p-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-10 w-10 rounded-2xl bg-[#151518] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center text-[13px] font-bold text-[#B99A6B]">01</span>
              <div>
                <h2 className="text-[16px] font-medium">Your look</h2>
                <p className="text-[12px] text-[#8B8B90]">One outfit, one honest opinion.</p>
              </div>
            </div>

            <div
              className={`relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] bg-[#151518] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),inset_-4px_-4px_10px_rgba(255,255,255,0.03)] transition-all ${isDragging ? "ring-2 ring-[#B99A6B]" : ""}`}
              onDragOver={handleDragOver} onDragEnter={handleDragOver}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false); }}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <Image className="object-cover w-full h-full" src={previewUrl} alt="Selected outfit preview" width={720} height={900} unoptimized />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                  <span className="text-3xl text-[#B99A6B]">↑</span>
                  <strong className="text-[14px]">Drop your outfit photo here</strong>
                  <span className="text-[12px] text-[#8B8B90]">or tap to choose from your camera roll</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#55555A] mt-2">JPEG, PNG or WebP · up to 4 MB</span>
                </div>
              )}
              <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" type="file" accept="image/*" onChange={handleFileInput} />
            </div>

            {file && <p className="mt-4 text-[12px] text-[#8B8B90] text-center truncate">{file.name}</p>}

            <button
              className="mt-6 w-full rounded-[1.2rem] bg-[#B99A6B] py-4 text-[12px] font-semibold text-[#121214] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(185,154,107,0.3)] transition-all hover:bg-[#C4A77D] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
              type="button" disabled={!file || isLoading} onClick={analyzeOutfit}
            >
              {isLoading ? "Putting the look together..." : "Analyze Outfit"} {!isLoading && <span>↗</span>}
            </button>

            {isLoading && (
              <p className="mt-4 text-[12px] text-[#B99A6B] text-center animate-pulse" role="status" aria-live="polite">
                {LOADING_MESSAGES[loadingIndex]}
              </p>
            )}
            {errorMessage && <p className="mt-4 text-[12px] text-red-400 text-center" role="alert">{errorMessage}</p>}
            <p className="mt-6 text-[11px] text-[#55555A] text-center">Your photo is analyzed for clothing and styling only.</p>
          </div>

          {/* Results Column */}
          <div className="relative rounded-[2rem] bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_16px_32px_rgba(0,0,0,0.4)] p-8">
            {result ? (
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-2">The Style Notes</p>
                  <h2 className="text-2xl font-medium">Here&apos;s the read.</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-[#151518] rounded-[1.5rem] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] p-6 flex flex-col items-center justify-center text-center">
                    <div className="relative h-24 w-24 rounded-full flex items-center justify-center mb-3"
                         style={{ background: `conic-gradient(#B99A6B var(--score), #1C1C21 0)`, ...scoreStyle }}>
                      <div className="absolute inset-1 bg-[#151518] rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                        <strong className="text-2xl font-semibold text-[#E8E6E3]">{result.harmony_score}</strong>
                        <span className="text-[9px] uppercase tracking-wider text-[#8B8B90]">Harmony</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8B8B90]">How the pieces work together</p>
                  </div>

                  <div className="bg-[#151518] rounded-[1.5rem] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] p-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#8B8B90] mb-3">The Pieces</p>
                    <ul className="space-y-1.5 mb-5">
                      {result.detected_items.map((item, i) => <li key={i} className="text-[13px] font-medium capitalize">{item}</li>)}
                    </ul>
                    <p className="text-[10px] uppercase tracking-widest text-[#8B8B90] mb-2">Color Story</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {result.dominant_colors.map((color, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-[#1C1C21] text-[10px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] text-[#E8E6E3]">{color}</span>)}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8B8B90] mb-1">Occasion Fit</p>
                    <p className="text-[12px] text-[#8B8B90]">{result.occasion_fit}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-1">Small moves, big difference</p>
                    <h3 className="text-[16px] font-medium">Three ways to take it further.</h3>
                  </div>
                  <div className="space-y-3">
                    {result.three_fixes.map((fix, i) => (
                      <div key={i} className="flex gap-4 bg-[#151518] rounded-2xl p-4 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]">
                        <span className="text-[12px] font-bold text-[#B99A6B] shrink-0 mt-0.5">0{i+1}</span>
                        <p className="text-[13px] text-[#C9C7C4] leading-relaxed">{fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="h-16 w-16 rounded-3xl bg-[#151518] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] flex items-center justify-center text-2xl text-[#B99A6B] mb-6">
                  S<span className="text-[14px]">.</span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-2">Your style, your call</p>
                <h2 className="text-xl font-medium mb-2">A little clarity goes a long way.</h2>
                <p className="text-[13px] text-[#8B8B90] max-w-xs">Upload a look to see its color harmony, the pieces that make it, and three ideas to try next.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
