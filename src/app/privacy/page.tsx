"use client";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="flex flex-col h-[100dvh] bg-black text-white overflow-y-auto px-6 py-12">
      <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-8">← Back</Link>
      <h1 className="font-serif text-[36px] mb-6">Privacy Policy</h1>
      <div className="text-[14px] text-[#CCC] space-y-4 leading-relaxed">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        <p>Style AI is built privacy-first. We believe your face and body are your own.</p>
        <p><strong>1. On-Device Processing:</strong> When you scan an outfit, your face and body images are processed locally on your phone. We do not upload your face to our servers.</p>
        <p><strong>2. Closet Images:</strong> When you save an outfit, we upload the cropped clothing items (not your face) to Supabase Storage.</p>
        <p><strong>3. AI Processing:</strong> We send anonymized outfit images to Groq to analyze the clothing.</p>
        <p><strong>4. Data Deletion:</strong> You can delete your account and all associated data at any time.</p>
      </div>
    </main>
  );
}
