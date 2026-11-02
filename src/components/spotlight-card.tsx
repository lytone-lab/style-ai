"use client";

import { ReactNode } from "react";

export function ClayCard({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div
      className={`
        relative rounded-[2rem] bg-[#1C1C21] 
        shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_16px_32px_rgba(0,0,0,0.4)] 
        transition-all duration-300 
        hover:-translate-y-1 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      <div className="p-8 h-full">
        {children}
      </div>
    </div>
  );
}
