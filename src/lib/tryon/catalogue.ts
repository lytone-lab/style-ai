import type { Garment } from "./types";

export const GARMENTS: Garment[] = [
  { id: "g-001", name: "Structured Wool Blazer", brand: "Atelier 12", category: "blazer", tone: "cool", occasion: ["Boardroom"], swatch: "#2E3A46" },
  { id: "g-002", name: "Ivory Silk Shirt", brand: "Maison Nord", category: "shirt", tone: "warm", occasion: ["Interview"], swatch: "#EDE6D8" },
  { id: "g-003", name: "Charcoal Tailored Trouser", brand: "Atelier 12", category: "trouser", tone: "neutral", occasion: ["Boardroom"], swatch: "#3A3A3C" },
  { id: "g-004", name: "Camel Wool Overcoat", brand: "Verdant", category: "outerwear", tone: "warm", occasion: ["Commute"], swatch: "#B08A5E" },
  { id: "g-005", name: "Navy Midi Sheath Dress", brand: "Lumen Studio", category: "dress", tone: "cool", occasion: ["Keynote"], swatch: "#1F2A44" },
  { id: "g-006", name: "Merino Fine Knit", brand: "Maison Nord", category: "knitwear", tone: "neutral", occasion: ["Office"], swatch: "#8A8D91" },
  { id: "g-007", name: "Slate Poplin Shirt", brand: "Lumen Studio", category: "shirt", tone: "cool", occasion: ["Office"], swatch: "#5B6B7A" },
  { id: "g-008", name: "Black Tuxedo Blazer", brand: "Atelier 12", category: "blazer", tone: "neutral", occasion: ["Gala"], swatch: "#141416" },
];

export const CATEGORY_LABELS: Record<Garment["category"] | "all", string> = {
  all: "All", blazer: "Blazers", shirt: "Shirts", trouser: "Trousers", 
  dress: "Dresses", knitwear: "Knitwear", outerwear: "Outerwear",
};
