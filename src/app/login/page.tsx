"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import { Alert, Field, Input } from "@/components/ui/primitives";

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function CustomerSignIn({ redirect }: { redirect: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "sent" | "error"; message?: string; devLink?: string }>({ status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="text-center" role="status">
        <MailCheck size={40} strokeWidth={1.4} className="mx-auto text-forest" aria-hidden />
        <h2 className="mt-4 text-2xl text-ink">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>. It expires in 20 minutes.
        </p>
        {state.devLink && (
          <Alert className="mt-5 text-left">
            <strong>Development mode:</strong> email isn&apos;t configured, so here&apos;s your link:{" "}
            <a href={state.devLink} className="break-all font-medium text-forest underline">Open sign-in link</a>
          </Alert>
        )}
        <button type="button" onClick={() => setState({ status: "idle" })} className="mt-6 text-sm font-medium text-forest hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();
        setState({ status: "loading" });
        try {
          const res = await fetch("/api/auth/request-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, redirect }),
          });
          const data = await res.json();
          setState(res.ok ? { status: "sent", devLink: data.devLink } : { status: "error", message: data.error });
        } catch {
          setState({ status: "error", message: "We couldn't connect. Please try again." });
        }
      }}
    >
      <Field label="Email address" htmlFor="login-email">
        <Input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
      <button type="submit" disabled={state.status === "loading"} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest text-sm font-semibold text-ivory transition hover:bg-forest-dark disabled:opacity-60">
        {state.status === "loading" ? "Sending link…" : (<>Email me a sign-in link <ArrowRight size={16} aria-hidden /></>)}
      </button>
      <p className="text-center text-xs text-muted">No password needed. New here? Signing in creates your account.</p>
    </form>
  );
}

function StaffSignIn() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          const data = await res.json();
          if (res.ok) {
            router.push("/admin");
            router.refresh();
          } else setError(data.error || "Sign-in failed.");
        } catch {
          setError("Network error.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <Field label="Staff password" htmlFor="staff-password">
        <div className="relative">
          <Input id="staff-password" required type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <button type="submit" disabled={loading} className="h-12 w-full rounded-full border border-ink/15 bg-white text-sm font-semibold text-ink hover:border-forest disabled:opacity-60">
        {loading ? "Signing in…" : "Staff sign in"}
      </button>
    </form>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const expired = params.get("error") === "expired";
  const [staff, setStaff] = useState(false);

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow-card)] sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl text-ink">{staff ? "Staff sign in" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted">{staff ? "For Realmsgifts team members." : "Sign in to track orders, save recipients and keep your wishlist."}</p>
      </div>
      {expired && !staff && <Alert tone="error" className="mb-5">That sign-in link has expired or was already used. Request a new one below.</Alert>}
      {staff ? <StaffSignIn /> : <CustomerSignIn redirect={redirect} />}
      <div className="mt-8 border-t border-line pt-5 text-center text-sm text-muted">
        {staff ? (
          <button type="button" onClick={() => setStaff(false)} className="font-medium text-forest hover:underline">Customer sign in</button>
        ) : (
          <>
            <Link href="/shop" className="font-medium text-forest hover:underline">Continue as guest</Link>
            <span className="mx-2" aria-hidden>·</span>
            <button type="button" onClick={() => setStaff(true)} className="hover:text-ink">Staff</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-cream" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
