"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert, Field, Input } from "@/components/ui/primitives";

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function CustomerAuth({ redirect }: { redirect: string }) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "loading" | "error"; message?: string }>({ status: "idle" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      if (isSignUp) {
        // 1. Customer Sign Up
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          setState({ status: "error", message: registerData.error || "Failed to create account." });
          return;
        }

        // Auto sign-in on registration success
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          router.push(redirect);
          router.refresh();
        } else {
          setIsSignUp(false);
          setState({ status: "error", message: "Account created! Please sign in with your password." });
        }
      } else {
        // 2. Customer Sign In
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (res.ok) {
          if (data.role === "ADMIN") {
            window.location.href = "/admin";
            return;
          }
          router.push(redirect);
          router.refresh();
        } else {
          setState({ status: "error", message: data.error || "Invalid email or password." });
        }
      }
    } catch {
      setState({ status: "error", message: "We couldn't connect. Please try again." });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {isSignUp && (
        <Field label="Full name" htmlFor="login-name">
          <Input
            id="login-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adanna Smith"
          />
        </Field>
      )}

      <Field label="Email address" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="login-password">
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
      </Field>

      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}

      <button
        type="submit"
        disabled={state.status === "loading"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest text-sm font-semibold text-ivory transition hover:bg-forest-dark disabled:opacity-60"
      >
        {state.status === "loading" ? (
          "Processing…"
        ) : (
          <>
            {isSignUp ? "Create account" : "Sign in"} <ArrowRight size={16} aria-hidden />
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted">
        {isSignUp ? "Already have an account?" : "New to Realms Gifts?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setState({ status: "idle" });
          }}
          className="font-medium text-forest hover:underline"
        >
          {isSignUp ? "Sign in instead" : "Create an account"}
        </button>
      </p>
    </form>
  );
}

function StaffSignIn() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e: FormEvent) => {
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
            // Hard redirect to clear session state and load /admin dashboard
            window.location.href = "/admin";
            return;
          } else {
            setError(data.error || "Incorrect staff password.");
          }
        } catch {
          setError("Network error. Please check your connection.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <Field label="Staff password" htmlFor="staff-password">
        <div className="relative">
          <Input
            id="staff-password"
            required
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
      </Field>

      {error && <Alert tone="error">{error}</Alert>}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full border border-ink/15 bg-white text-sm font-semibold text-ink hover:border-forest disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Staff sign in"}
      </button>
    </form>
  );
}

function LoginContent() {
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [staff, setStaff] = useState(false);

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow-card)] sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl text-ink">{staff ? "Staff sign in" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted">
          {staff
            ? "For Realmsgifts team members."
            : "Sign in or create an account to track orders and save recipient details."}
        </p>
      </div>

      {staff ? <StaffSignIn /> : <CustomerAuth redirect={redirect} />}

      <div className="mt-8 border-t border-line pt-5 text-center text-sm text-muted">
        {staff ? (
          <button
            type="button"
            onClick={() => setStaff(false)}
            className="font-medium text-forest hover:underline"
          >
            Customer sign in
          </button>
        ) : (
          <>
            <Link href="/shop" className="font-medium text-forest hover:underline">
              Continue as guest
            </Link>
            <span className="mx-2" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={() => setStaff(true)}
              className="hover:text-ink"
            >
              Staff
            </button>
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