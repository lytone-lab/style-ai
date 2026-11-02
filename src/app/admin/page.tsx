"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Profile = { id: string; email: string; created_at: string };
type Scan = { id: string; harmony_score: number; vibe: string; image_url: string; created_at: string };
type Waitlist = { id: string; email: string; created_at: string };

export default function AdminDashboardPage() {
  const [data, setData] = useState<{ profiles: Profile[], scans: Scan[], waitlist: Waitlist[] } | null>(null);
  const [error, setError] = useState<{ message: string, userEmail: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/data")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw json;
        return json;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError({ message: err.error, userEmail: err.userEmail }); setLoading(false); });
  }, []);

  if (loading) return <main className="min-h-screen bg-[#000000] text-[#FFFFFF] flex items-center justify-center font-black uppercase tracking-widest">Authenticating...</main>;
  
  if (error) return (
    <main className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col items-center justify-center font-sans">
      <h1 className="text-3xl font-black text-red-500 mb-2">Access Denied.</h1>
      <p className="text-[#888888] mb-6">You are currently logged in as: <strong className="text-[#FFFFFF]">{error.userEmail}</strong></p>
      <div className="flex gap-4">
        <Link href="/login" className="text-[12px] font-bold uppercase tracking-widest text-[#000000] bg-[#FFFFFF] px-6 py-3 rounded-xl hover:bg-[#E0E0E0]">Go to Login</Link>
        <Link href="/dashboard" className="text-[12px] font-bold uppercase tracking-widest text-[#FFFFFF] border border-[#222222] px-6 py-3 rounded-xl hover:bg-[#111111]">Go to App</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#000000] text-[#FFFFFF] px-6 py-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-[28px] font-black tracking-tighter leading-tight">Admin Center</h1>
          <p className="text-[#888888] text-[12px] mt-1">Full ecosystem visibility.</p>
        </div>
        <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-[#000000] bg-[#FFFFFF] px-4 py-2.5 rounded-xl hover:bg-[#E0E0E0] transition-colors">
          Exit
        </Link>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-2">Total Users</p>
          <p className="text-[32px] font-black text-[#00FF66] leading-none">{data?.profiles.length || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-2">Total Scans</p>
          <p className="text-[32px] font-black text-[#FFFFFF] leading-none">{data?.scans.length || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-2">Waitlist Signups</p>
          <p className="text-[32px] font-black text-[#FFFFFF] leading-none">{data?.waitlist.length || 0}</p>
        </div>
      </div>

      {/* Global Feed */}
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[18px] font-bold tracking-tight">Global Outfit Feed</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-10">
        {data?.scans.map((scan) => (
          <div key={scan.id} className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-[3/4] w-full bg-[#222222]">
              {scan.image_url && <Image src={scan.image_url} alt="Scan" fill className="object-cover" unoptimized />}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
                <span className="text-[12px] font-black text-[#FFFFFF]">{scan.harmony_score}</span>
              </div>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#00FF66] truncate">{scan.vibe}</p>
              <p className="text-[10px] text-[#888888] mt-1">{new Date(scan.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
