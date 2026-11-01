"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS, GARMENTS } from "@/lib/tryon/catalogue";
import type { Garment } from "@/lib/tryon/types";

const FILTERS = Object.keys(CATEGORY_LABELS) as Array<Garment["category"] | "all">;

export default function GarmentGrid({
  selectedId,
  onSelect,
  disabled,
}: {
  selectedId: string | null;
  onSelect: (g: Garment) => void;
  disabled?: boolean;
}) {
  const [filter, setFilter] = useState<Garment["category"] | "all">("all");

  const items = useMemo(
    () => (filter === "all" ? GARMENTS : GARMENTS.filter((g) => g.category === filter)),
    [filter]
  );

  return (
    <section aria-label="Garment selection" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((key) => {
          const active = key === filter;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(key)}
              className={[
                "rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.14em] uppercase transition-colors border",
                active
                  ? "border-[#B99A6B]/60 bg-[#B99A6B]/10 text-[#E8E6E3]"
                  : "border-white/8 bg-white/[0.02] text-[#8B8B90] hover:border-white/15",
              ].join(" ")}
            >
              {CATEGORY_LABELS[key]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((g) => {
          const active = g.id === selectedId;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              disabled={disabled}
              aria-pressed={active}
              className={[
                "group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
                "disabled:cursor-not-allowed disabled:opacity-40",
                active
                  ? "border-[#B99A6B]/70 bg-[#B99A6B]/[0.07]"
                  : "border-white/8 bg-white/[0.015] hover:border-white/20",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="h-12 w-full rounded-md border border-black/40"
                style={{ background: `linear-gradient(145deg, ${g.swatch} 0%, ${g.swatch}dd 55%, #0d0d0f 140%)` }}
              />
              <span className="text-[12.5px] leading-tight text-[#E8E6E3]">{g.name}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#6E6E74]">
                {g.brand} · {g.tone}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
