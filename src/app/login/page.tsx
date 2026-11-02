"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage("Check your email for the confirmation link.");
        setIsLogin(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-8 shrink-0">
        <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">
          ← Back
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#555555]">
          {isLogin ? "Welcome Back" : "Create Account"}
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12 w-full max-w-md mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="text-[52px] font-black leading-[1.0] tracking-tighter mb-3">
            {isLogin ? "Sign in." : "Join the beta."}
          </h1>
          <p className="text-[14px] text-[#888888] leading-relaxed max-w-[260px] mx-auto">
            {isLogin
              ? "Access your digital wardrobe and daily style intelligence."
              : "Start building your cloud-synced closet today."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-5 w-full">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-2 block ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-[#111111] border border-[#222222] text-[#FFFFFF] text-[15px] px-5 py-4 rounded-2xl focus:outline-none focus:border-[#FFFFFF] transition-colors placeholder:text-[#444444]"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#555555] mb-2 block ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#111111] border border-[#222222] text-[#FFFFFF] text-[15px] px-5 py-4 rounded-2xl focus:outline-none focus:border-[#FFFFFF] transition-colors placeholder:text-[#444444]"
            />
          </div>

          {errorMessage && <p className="text-[12px] text-red-500 font-medium text-center" role="alert">{errorMessage}</p>}
          {successMessage && <p className="text-[12px] text-[#00FF66] font-medium text-center" role="status">{successMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[68px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[15px] disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); setSuccessMessage(null); }}
            className="text-[13px] font-medium text-[#888888] hover:text-[#FFFFFF] transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
