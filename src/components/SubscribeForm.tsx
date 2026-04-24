"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export function SubscribeForm({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");

      setStatus("success");
      setMessage("Subscribed to updates!");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-sm font-medium text-[#22C55E] h-[42px] animate-in fade-in zoom-in-95">
        <CheckCircle2 size={16} />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex items-center gap-2 h-[42px]">
      <div className="relative h-full flex items-center">
        <Mail size={14} className="absolute left-3 text-muted-text" />
        <input
          type="email"
          placeholder="Get email updates"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          className="h-full w-[220px] bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 text-sm text-off-white placeholder:text-muted-text focus:outline-none focus:border-[#FF9933]/50 focus:bg-white/10 transition-all disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading" || !email}
        className="h-full px-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-sm font-medium text-off-white transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
      >
        {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : "Subscribe"}
      </button>
      {status === "error" && <span className="text-xs text-red-400 absolute -bottom-6 left-0">{message}</span>}
    </form>
  );
}
