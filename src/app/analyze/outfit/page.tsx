"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CropBox = { x: number; y: number; w: number; h: number };
type DetectedItem = { name: string; cropBox: CropBox | null; previewUrl?: string };
type OutfitCheckResult = {
  detected_items: any[]; 
  dominant_colors: string[];
  harmony_score: number;
  occasion_fit: string;
  three_fixes: [string, string, string];
  vibe: string;
  style_archetype: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function OutfitAnalysisPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitCheckResult | null>(null);
  
  const [editedItems, setEditedItems] = useState<DetectedItem[]>([]);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [activeEditIndex, setActiveEditIndex] = useState(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setErrorMessage(null); setResult(null); setEditedItems([]); setIsEditingItems(false);
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) { setFile(null); setErrorMessage("Choose a JPEG, PNG, or WebP image."); return; }
    if (selectedFile.size > MAX_FILE_BYTES) { setFile(null); setErrorMessage("Choose an image smaller than 4 MB."); return; }
    setFile(selectedFile);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => { selectFile(event.target.files?.[0]); event.target.value = ""; };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); selectFile(event.dataTransfer.files[0]); };
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };

  const cropImage = async (sourceFile: File, box: CropBox): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        
        const cropWidth = img.width * box.w;
        const cropHeight = img.height * box.h;
        const xmin = img.width * box.x;
        const ymin = img.height * box.y;

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        ctx.drawImage(img, xmin, ymin, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject("Crop failed");
        }, "image/png");
      };
      img.src = URL.createObjectURL(sourceFile);
    });
  };

  const analyzeOutfit = async () => {
    if (!file || isLoading) return;
    setIsLoading(true); setErrorMessage(null); setResult(null);
    const formData = new FormData(); formData.append("image", file);
    
    try {
      const response = await fetch("/api/outfit-check", { method: "POST", body: formData });
      const payload = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 3000)); 

      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      
      const parsedItems: DetectedItem[] = payload.detected_items.map((item: any) => {
        const name = typeof item === "string" ? item : item?.name || "Unknown Item";
        // NO auto-cropping. Set to null.
        return { name, cropBox: null, previewUrl: undefined };
      });

      setResult(payload);
      setEditedItems(parsedItems);
      
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally { setIsLoading(false); }
  };

  const commitCropBox = async (index: number, newBox: CropBox) => {
    if (!file) return;
    
    // Update the box in state
    setEditedItems(prev => {
      const newItems = [...prev];
      newItems[index].cropBox = newBox;
      return newItems;
    });

    // Generate the preview only after they draw
    try {
      const blob = await cropImage(file, newBox);
      setEditedItems(prev => {
        const newItems = [...prev];
        if (newItems[index].previewUrl) URL.revokeObjectURL(newItems[index].previewUrl!);
        newItems[index].previewUrl = URL.createObjectURL(blob);
        return newItems;
      });
    } catch (e) {
      console.warn("Preview failed", e);
    }
  };

  const saveToCloset = async () => {
    if (!file || !result || isSaving) return;
    setIsSaving(true); setErrorMessage(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const savedItems = [];
      
      for (let i = 0; i < editedItems.length; i++) {
        const item = editedItems[i];
        
        // Fallback if user didn't crop: default to center 80%
        const box = item.cropBox || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

        setSaveStatus(`Isolating item ${i + 1}/${editedItems.length}...`);
        const croppedBlob = await cropImage(file, box);
        
        let finalBlob: Blob = croppedBlob;
        try {
            finalBlob = await removeBackground(croppedBlob);
        } catch (e) {
            console.warn("BG removal failed", e);
        }

        const fileName = `${user.id}/${Date.now()}-${i}.png`;
        await supabase.storage.from('outfits').upload(fileName, finalBlob);
        const { data: { publicUrl } } = supabase.storage.from('outfits').getPublicUrl(fileName);

        savedItems.push({ name: item.name, image_url: publicUrl });
      }

      setSaveStatus("Saving...");
      
      await supabase.from('scans').insert({
        user_id: user.id,
        image_url: savedItems[0]?.image_url || null,
        harmony_score: result.harmony_score,
        detected_items: savedItems,
        vibe: result.vibe,
        style_archetype: result.style_archetype,
      });

      router.push("/closet");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to save.");
    } finally { setIsSaving(false); setSaveStatus(""); }
  };

  if (isLoading) {
    return (
      <main className="relative flex flex-col h-screen max-w-md mx-auto w-full bg-[#000000] text-[#FFFFFF] items-center justify-center p-6">
        {previewUrl && <Image src={previewUrl} alt="Blur" fill className="object-cover opacity-20 blur-xl" unoptimized />}
        <div className="relative z-10 flex flex-col gap-6 w-full max-w-[280px]">
          <h2 className="font-serif text-[24px] tracking-tight text-center mb-4 text-[#FFFFFF]">Analyzing...</h2>
          <p className="text-center text-[13px] text-[#888] animate-pulse">Extracting garments...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] max-w-md mx-auto w-full overflow-hidden bg-[#000000] text-[#FFFFFF]">
      <header className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-[#222222] z-10 bg-[#000000]">
        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">← Back</Link>
        <span className="text-[14px] font-black uppercase tracking-tighter">Outfit Check</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto overflow-x-hidden w-full">
        {!result ? (
          <div className="flex flex-col h-full">
            <h1 className="font-serif text-[36px] leading-[1.05] mb-3">Scan your <br />fit.</h1>
            <p className="text-[14px] text-[#888888] mb-8 leading-relaxed">Drop a photo below. Our AI extracts the garments and removes you from the image.</p>
            <div className={`relative flex-1 w-full overflow-hidden rounded-xl bg-[#111111] border-2 transition-all ${isDragging ? "border-[#FFFFFF]" : "border-[#222222] border-dashed"} flex flex-col items-center justify-center`} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={handleDrop}>
              {previewUrl ? <Image className="object-cover w-full h-full absolute inset-0" src={previewUrl} alt="Preview" width={720} height={900} unoptimized /> : <div className="flex flex-col items-center gap-3 text-center p-6"><span className="text-4xl text-[#FFFFFF] mb-2">+</span><span className="text-[14px] font-bold uppercase tracking-widest text-[#FFFFFF]">Tap to Upload</span></div>}
              <input className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" type="file" accept="image/*" onChange={handleFileInput} />
            </div>
            {errorMessage && <p className="mt-4 text-[13px] text-red-500 font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">{errorMessage}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-5 animate-slide-up w-full">
            <h1 className="font-serif text-[36px] leading-[1.05]">Analysis <br />complete.</h1>
            
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 flex flex-col shrink-0 w-full overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66] mb-2">{result.vibe}</p>
              <h2 className="font-serif text-[24px] mb-3 leading-tight truncate">{result.style_archetype}</h2>
              <p className="text-[13px] text-[#888888] leading-relaxed line-clamp-3">{result.occasion_fit}</p>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 flex items-center justify-between gap-4 shrink-0 w-full overflow-hidden">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-widest text-[#FFFFFF]">Harmony Score</p>
                <p className="text-[11px] text-[#888888] mt-1 truncate">Aesthetic balance</p>
              </div>
              <div className="shrink-0 flex items-baseline gap-1">
                <span className="text-[36px] font-black leading-none">{result.harmony_score}</span>
                <span className="text-[14px] text-[#555] font-bold">/100</span>
              </div>
            </div>

            <div className="shrink-0 w-full mt-2">
              <div className="mb-3 px-1 flex justify-between items-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Detected Items</p>
              </div>
              
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide w-full overscroll-x-contain">
                {editedItems.map((item, i) => (
                  <div key={i} className="flex flex-col shrink-0 w-[130px] snap-center">
                    <div className="relative w-full aspect-square bg-[#0B0B0B] border border-[#222] rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                       {item.previewUrl ? (
                         <Image src={item.previewUrl} alt={item.name} fill className="object-cover opacity-90" unoptimized />
                       ) : (
                         <span className="text-[10px] font-bold text-[#555] uppercase text-center px-2">Needs Crop</span>
                       )}
                    </div>
                    <p className="text-[12px] font-bold text-white line-clamp-2 leading-tight">{item.name}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-1 px-1">
                <button 
                  onClick={() => { setIsEditingItems(true); setActiveEditIndex(0); }} 
                  className="flex items-center justify-center bg-[#111] border border-[#333] rounded-md p-2.5 active:scale-95 transition-transform"
                  aria-label="Edit crops"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 mt-2 w-full">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] px-1">Three Fixes</p>
              {result.three_fixes.map((fix, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-lg p-5 flex gap-4 w-full overflow-hidden">
                  <span className="text-[14px] font-black text-[#00FF66] mt-0.5 shrink-0">0{i+1}</span>
                  <p className="text-[13px] text-[#CCCCCC] leading-relaxed min-w-0">{fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full px-6 pb-8 pt-4 shrink-0 bg-black z-20 border-t border-[#111]">
        {!result ? (
          <button onClick={analyzeOutfit} disabled={!file} className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[64px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[15px] disabled:opacity-50">Analyze Outfit</button>
        ) : (
          <button onClick={saveToCloset} disabled={isSaving} className="w-full flex items-center justify-center bg-[#00FF66] text-[#000000] h-[64px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[15px] disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
            {isSaving ? saveStatus : "Save to Closet"}
          </button>
        )}
      </div>

      {/* SINGLE IMAGE CROP TOOL */}
      {isEditingItems && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/90 backdrop-blur-md w-full overflow-hidden">
          <div className="bg-[#111111] rounded-t-xl p-6 border-t border-[#222222] w-full max-w-md mx-auto max-h-[90vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-serif text-[24px] tracking-tight">Manual Crop</h3>
              <button onClick={() => setIsEditingItems(false)} className="text-[#888888] bg-[#222222] rounded-full w-10 h-10 flex items-center justify-center text-lg">✕</button>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col mb-4 scrollbar-hide">
              
              <div className="relative w-full h-[320px] bg-[#050505] rounded-lg overflow-hidden border border-[#333] mb-6 shrink-0">
                 {previewUrl && (
                   <CropBoxEditor 
                     imageUrl={previewUrl} 
                     box={editedItems[activeEditIndex].cropBox || { x: 0, y: 0, w: 0, h: 0 }} 
                     onChange={(newBox) => {
                        const newItems = [...editedItems];
                        newItems[activeEditIndex].cropBox = newBox;
                        setEditedItems(newItems);
                     }} 
                     onComplete={(newBox) => commitCropBox(activeEditIndex, newBox)}
                   />
                 )}
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold text-[#888888] uppercase mb-2">Select Item</p>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                  {editedItems.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveEditIndex(i)}
                      className={`flex flex-col items-center p-2 rounded-lg border shrink-0 w-[90px] transition-colors ${
                        activeEditIndex === i ? 'border-[#00FF66] bg-[#1A1A1A]' : 'border-[#222] bg-[#0B0B0B]'
                      }`}
                    >
                       <div className="relative w-14 h-14 mb-2 rounded-md overflow-hidden bg-black flex items-center justify-center">
                          {item.previewUrl ? (
                            <Image src={item.previewUrl} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <span className="text-[8px] text-[#555] font-bold">EMPTY</span>
                          )}
                       </div>
                       <span className="text-[10px] font-bold text-white truncate w-full text-center px-1">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#888888] uppercase mb-2">Item Name</p>
                <input 
                  type="text" 
                  value={editedItems[activeEditIndex].name} 
                  onChange={(e) => { 
                    const newItems = [...editedItems]; 
                    newItems[activeEditIndex].name = e.target.value; 
                    setEditedItems(newItems); 
                  }} 
                  className="w-full bg-[#000000] border border-[#333333] text-[#FFFFFF] text-[15px] px-4 py-3 rounded-lg focus:outline-none focus:border-[#FFFFFF]" 
                />
              </div>

            </div>
            <button onClick={() => setIsEditingItems(false)} className="w-full shrink-0 bg-[#FFFFFF] text-[#000000] h-[64px] rounded-full font-black uppercase tracking-widest text-[15px]">Save Crops</button>
          </div>
        </div>
      )}
    </main>
  );
}

function CropBoxEditor({ imageUrl, box, onChange, onComplete }: { imageUrl: string; box: CropBox; onChange: (b: CropBox) => void; onComplete: (b: CropBox) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setStartPos({ x, y });
    onChange({ x, y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    onChange({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      w: Math.abs(currentX - startPos.x),
      h: Math.abs(currentY - startPos.y),
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    if (box.w > 0.05 && box.h > 0.05) {
      onComplete(box);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img src={imageUrl} alt="Crop base" className="w-full h-full object-contain pointer-events-none" />
      
      {box.w > 0 && (
        <div 
          className="absolute border border-[#00FF66] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none"
          style={{ 
            left: `${box.x * 100}%`, 
            top: `${box.y * 100}%`, 
            width: `${box.w * 100}%`, 
            height: `${box.h * 100}%` 
          }}
        >
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#00FF66] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-[#00FF66] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00FF66] -translate-x-1/2 translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00FF66] translate-x-1/2 translate-y-1/2" />
        </div>
      )}
    </div>
  );
}
