"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function NewsletterForm({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string }>({ status: "idle" });
  const id = `newsletter-${tone}`;

  if (state.status === "done") {
    return (
      <p role="status" className={cn("text-sm font-medium", tone === "dark" ? "text-gold" : "text-success", className)}>
        You&apos;re on the list. Thank you for subscribing!
      </p>
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-2 sm:flex-row", className)}
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: "loading" });
        try {
          const res = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          setState(res.ok ? { status: "done" } : { status: "error", message: data.error });
        } catch {
          setState({ status: "error", message: "Couldn't connect. Please try again." });
        }
      }}
    >
      <label htmlFor={id} className="sr-only">Email address</label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-invalid={state.status === "error"}
        aria-describedby={state.status === "error" ? `${id}-error` : undefined}
        className={cn(
          "h-12 min-w-0 flex-1 rounded-full px-5 text-sm focus:outline-none focus:ring-2",
          tone === "dark"
            ? "bg-ivory/10 text-ivory placeholder:text-ivory/60 ring-1 ring-ivory/20 focus:ring-gold"
            : "border border-line bg-white text-ink placeholder:text-muted focus:border-forest focus:ring-forest/15",
        )}
      />
      <button
        type="submit"
        disabled={state.status === "loading"}
        className={cn(
          "h-12 shrink-0 rounded-full px-6 text-sm font-semibold transition disabled:opacity-60",
          tone === "dark" ? "bg-gold text-forest-dark hover:bg-ivory" : "bg-forest text-ivory hover:bg-forest-dark",
        )}
      >
        {state.status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
      {state.status === "error" && (
        <p id={`${id}-error`} role="alert" className={cn("text-xs sm:basis-full", tone === "dark" ? "text-gold" : "text-sale")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
