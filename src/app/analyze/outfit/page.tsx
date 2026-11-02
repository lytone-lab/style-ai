"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OutfitCheckResult = {
  detected_items: string[];
  dominant_colors: string[];
  harmony_score: number;
  occasion_fit: string;
  three_fixes: [string, string, string];
  vibe: string;
  style_archetype: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOADING_STEPS = ["Isolating garments & layers", "Detecting fabrics & textures", "Mapping color distribution", "Calculating harmony score"];

function isOutfitCheckResult(value: unknown): value is OutfitCheckResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    Array.isArray(result.detected_items) && result.detected_items.every((item) => typeof item === "string") &&
    Array.isArray(result.dominant_colors) && result.dominant_colors.every((color) => typeof color === "string") &&
    typeof result.harmony_score === "number" && Number.isFinite(result.harmony_score) && result.harmony_score >= 0 && result.harmony_score <= 100 &&
    typeof result.occasion_fit === "string" && typeof result.vibe === "string" && typeof result.style_archetype === "string" &&
    Array.isArray(result.three_fixes) && result.three_fixes.length === 3
  );
}

export default function OutfitAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitCheckResult | null>(null);
  const [editedItems, setEditedItems] = useState<string[]>([]);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      interval = setInterval(() => { setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const selectFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setErrorMessage(null); setResult(null); setEditedItems([]);
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
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "We couldn't analyze that outfit.";
        throw new Error(message);
      }
      if (!isOutfitCheckResult(payload)) throw new Error("The outfit analysis returned an unexpected response.");
      
      setResult(payload);
      setEditedItems(payload.detected_items);
    } catch (error) {
      const err = error as { message?: string; error_description?: string; error?: string };
      const exactMessage = err?.message || err?.error_description || err?.error || "Something went wrong.";
      setErrorMessage(exactMessage);
    } finally { setIsLoading(false); }
  };

  const saveToCloset = async () => {
    if (!file || !result || isSaving) return;
    setIsSaving(true); setErrorMessage(null);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('outfits').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('outfits').getPublicUrl(fileName);

      const finalItems = editedItems.filter(i => i.trim() !== "");

      const { error: dbError } = await supabase.from('scans').insert({
        user_id: user.id,
        image_url: publicUrl,
        harmony_score: result.harmony_score,
        detected_items: finalItems,
        vibe: result.vibe,
        style_archetype: result.style_archetype,
      });
      
      if (dbError) throw dbError;

      router.push("/dashboard");
    } catch (error) {
      const err = error as { message?: string; error_description?: string; error?: string };
      setErrorMessage(err?.message || "Failed to save to cloud.");
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <main className="relative flex flex-col h-screen bg-[#000000] text-[#FFFFFF] items-center justify-center p-6">
        {previewUrl && <Image src={previewUrl} alt="Blur" fill className="object-cover opacity-20 blur-xl" unoptimized />}
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
                <span className={`text-[14px] font-bold uppercase tracking-widest ${isCompleted ? "text-[#888888] line-through" : "text-[#FFFFFF]"}`}>{step}</span>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] relative overflow-hidden">
      <header className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-[#222222] z-10 bg-[#000000]">
        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">← Back</Link>
        <span className="text-[14px] font-black uppercase tracking-tighter">Outfit Check</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        {!result ? (
          <div className="flex flex-col h-full">
            <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-3">Scan your <br />fit.</h1>
            <p className="text-[14px] text-[#888888] mb-8 leading-relaxed">Drop a photo of your outfit below. Our AI will analyze the silhouette, harmony, and occasion fit.</p>

            <div className={`relative flex-1 w-full overflow-hidden rounded-[2rem] bg-[#111111] border-2 transition-all ${isDragging ? "border-[#FFFFFF]" : "border-[#222222] border-dashed"} flex flex-col items-center justify-center`} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={handleDrop}>
              {previewUrl ? (
                <Image className="object-cover w-full h-full absolute inset-0" src={previewUrl} alt="Outfit preview" width={720} height={900} unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <span className="text-4xl text-[#FFFFFF] mb-2">+</span>
                  <span className="text-[14px] font-bold uppercase tracking-widest text-[#FFFFFF]">Tap to Upload</span>
                </div>
              )}
              <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" type="file" accept="image/*" onChange={handleFileInput} />
            </div>
            {errorMessage && <p className="mt-4 text-[13px] text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20" role="alert">{errorMessage}</p>}
          </div>
        ) : (
          <div className="flex flex-col h-full gap-5 pb-10 animate-slide-up">
            <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-2">Analysis <br />complete.</h1>
            
            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 flex flex-col items-center text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#00FF66] mb-3">{result.vibe}</p>
              <h2 className="text-[28px] font-black tracking-tighter mb-2 leading-none">{result.style_archetype}</h2>
              <p className="text-[14px] text-[#888888] leading-relaxed max-w-[260px]">{result.occasion_fit}</p>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 flex flex-col items-center justify-center">
              <div className="relative h-48 w-48 rounded-full flex items-center justify-center mb-2" style={{ background: `conic-gradient(#FFFFFF ${result.harmony_score}%, #222222 0)` }}>
                <div className="absolute inset-2 bg-[#111111] rounded-full flex flex-col items-center justify-center">
                  <strong className="text-6xl font-black tracking-tighter">{result.harmony_score}</strong>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mt-1">Harmony</span>
                </div>
              </div>
            </div>

            {/* Editable Detected Items Card */}
            <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Detected Items</p>
                <button onClick={() => setIsEditingItems(true)} className="text-[11px] font-bold uppercase tracking-widest text-[#00FF66] bg-[#00FF66]/10 px-3 py-1 rounded-full">Edit</button>
              </div>
              <div className="flex flex-col gap-2">
                {editedItems.length === 0 ? (
                  <p className="text-[13px] text-[#555555] italic">No items detected.</p>
                ) : (
                  editedItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#00FF66] mt-1 text-[10px]">●</span>
                      <span className="text-[14px] text-[#FFFFFF] capitalize leading-snug">{item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#555555] ml-2">Three Fixes</p>
              {result.three_fixes.map((fix, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-[1.5rem] p-5 flex gap-4">
                  <span className="text-[14px] font-black text-[#00FF66] mt-0.5">0{i+1}</span>
                  <p className="text-[14px] text-[#CCCCCC] leading-relaxed">{fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4 shrink-0 bg-gradient-to-t from-black via-black to-transparent z-10 relative">
        {!result ? (
          <button onClick={analyzeOutfit} disabled={!file} className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px] disabled:opacity-50">Analyze Outfit</button>
        ) : (
          <button onClick={saveToCloset} disabled={isSaving} className="w-full flex items-center justify-center bg-[#00FF66] text-[#000000] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px] disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
            {isSaving ? "Saving..." : "Save to Closet"}
          </button>
        )}
      </div>

      {/* Bottom Sheet for Editing Items */}
      {isEditingItems && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md">
          <div className="bg-[#111111] rounded-t-[2.5rem] p-6 border-t border-[#222222] w-full max-h-[85vh] flex flex-col animate-slide-up">
            
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-[24px] font-black tracking-tight">Adjust Items</h3>
              <button onClick={() => setIsEditingItems(false)} className="text-[#888888] bg-[#222222] rounded-full w-10 h-10 flex items-center justify-center text-lg hover:text-[#FFFFFF] transition-colors">✕</button>
            </div>

            <p className="text-[13px] text-[#888888] mb-6 shrink-0">
              Fix any errors made by the AI so your closet stays organized.
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-6">
              {editedItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...editedItems];
                      newItems[i] = e.target.value;
                      setEditedItems(newItems);
                    }}
                    className="flex-1 bg-[#000000] border border-[#333333] text-[#FFFFFF] text-[15px] px-5 py-4 rounded-xl focus:outline-none focus:border-[#FFFFFF] transition-colors"
                  />
                  <button 
                    onClick={() => setEditedItems(editedItems.filter((_, idx) => idx !== i))} 
                    className="h-[54px] w-[54px] shrink-0 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {editedItems.length === 0 && (
                <p className="text-[13px] text-[#555555] text-center py-4">All items removed.</p>
              )}

              <button 
                onClick={() => setEditedItems([...editedItems, ""])} 
                className="flex items-center justify-center gap-2 w-full border border-dashed border-[#333333] text-[#888888] py-4 rounded-xl font-bold uppercase tracking-widest text-[12px] hover:border-[#FFFFFF] hover:text-[#FFFFFF] transition-colors mt-2"
              >
                <span>+</span> Add Item
              </button>
            </div>

            <button 
              onClick={() => setIsEditingItems(false)} 
              className="w-full shrink-0 bg-[#FFFFFF] text-[#000000] h-[64px] rounded-full font-black uppercase tracking-widest text-[15px] active:scale-[0.98] transition-transform"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
