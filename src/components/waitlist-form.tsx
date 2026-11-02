"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        onSubmit={onSubmit}
        className="relative flex items-center p-2 rounded-[1.5rem] bg-[#151518] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === "loading" || status === "success"}
          className="w-full bg-transparent px-5 py-3 text-[14px] text-[#E8E6E3] placeholder:text-[#55555A] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="shrink-0 rounded-[1.2rem] bg-[#B99A6B] px-6 py-3.5 text-[12px] font-semibold text-[#121214] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(185,154,107,0.3)] transition-all hover:bg-[#C4A77D] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          {status === "loading" ? "Joining..." : status === "success" ? "Joined" : "Get early access"}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-[12px] font-medium ${status === "error" ? "text-red-400" : "text-[#B99A6B]"}`}>
          {message}
        </p>
      )}
      {!message && (
        <p className="mt-4 text-[11px] tracking-wide text-[#55555A]">
          A little note when we&apos;re ready. No noise, ever.
        </p>
      )}
    </div>
  );
}
