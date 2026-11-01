export type GarmentCategory = "blazer" | "shirt" | "trouser" | "dress" | "knitwear" | "outerwear";
export type Tone = "warm" | "cool" | "neutral";
export interface Garment { id: string; name: string; brand: string; category: GarmentCategory; tone: Tone; occasion: string[]; swatch: string; }
export type TryOnPhase = "idle" | "ready" | "generating" | "result" | "error";
export interface TryOnResult { status: "rendered" | "preview_only" | "error"; provider: "fal" | "replicate" | null; garmentId: string; renderUrl: string | null; message: string; }
