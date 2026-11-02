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
    <main className="min-h-screen bg-[#000000] text-[#FFFFFF] px-6 py-12 md:px-12 font-sans">
      <header className="flex justify-between items-center mb-12 border-b border-[#222222] pb-6">
        <div>
          <h1 className="text-[32px] font-black tracking-tighter">Admin Command Center</h1>
          <p className="text-[#888888] text-sm mt-1">Full visibility into the Style AI ecosystem.</p>
        </div>
        <Link href="/dashboard" className="text-[12px] font-bold uppercase tracking-widest text-[#000000] bg-[#FFFFFF] px-6 py-3 rounded-xl hover:bg-[#E0E0E0] transition-colors">
          Exit to App
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mb-2">Total Users</p>
          <p className="text-[48px] font-black text-[#00FF66] leading-none">{data?.profiles.length || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mb-2">Total Scans</p>
          <p className="text-[48px] font-black text-[#FFFFFF] leading-none">{data?.scans.length || 0}</p>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mb-2">Waitlist Signups</p>
          <p className="text-[48px] font-black text-[#FFFFFF] leading-none">{data?.waitlist.length || 0}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight mb-6">Global Outfit Feed</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.scans.map((scan) => (
          <div key={scan.id} className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <div className="relative aspect-[3/4] w-full bg-[#222222]">
              {scan.image_url && <Image src={scan.image_url} alt="Scan" fill className="object-cover" unoptimized />}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00FF66]">{scan.vibe}</p>
              <div className="flex justify-between items-end mt-2">
                <span className="text-[12px] text-[#888888]">{new Date(scan.created_at).toLocaleDateString()}</span>
                <span className="text-xl font-black text-[#FFFFFF]">{scan.harmony_score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
