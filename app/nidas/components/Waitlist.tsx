"use client";

import { useState } from "react";

export default function Waitlist({ product }: { product?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product: product || "general" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="n-label" style={{ color: "var(--ink)" }}>
        You are on the list. We will be in touch when it drops.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        suppressHydrationWarning
        style={{
          flex: 1,
          background: "transparent",
          border: "1px solid var(--line-n)",
          padding: "0 1rem",
          height: "3.25rem",
          color: "var(--ink)",
          fontFamily: "var(--font-manrope)",
          fontSize: "0.95rem",
          outline: "none",
        }}
      />
      <button type="submit" disabled={state === "loading"} className="n-btn">
        {state === "loading" ? "Joining…" : "Join Waitlist"}
      </button>
      {state === "error" && (
        <span className="n-label" style={{ color: "#9a3a2a" }}>Try again</span>
      )}
    </form>
  );
}
