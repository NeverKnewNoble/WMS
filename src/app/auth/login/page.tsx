"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { JoshobWordmark } from "@/components/ui_components/wordmark";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(params.get("callbackUrl") ?? "/portal");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-white">
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src="/ally.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-zinc-950/95 via-zinc-950/70 to-zinc-950/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(226,107,26,0.18),transparent_55%)]" />

        {/* Hazard-stripe accent — a single signature element. */}
        <div
          aria-hidden
          className="bg-hazard pointer-events-none absolute -right-4 top-16 h-1.5 w-44 rotate-[-8deg] opacity-90 shadow-[0_8px_24px_rgba(226,107,26,0.25)]"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="Joshob Construction Co. Ltd." className="inline-flex w-fit">
            <JoshobWordmark size="md" />
          </Link>

          <blockquote className="max-w-md">
            <p className="text-2xl font-medium leading-relaxed text-white">
              &ldquo;Every bag of cement, every length of rebar — accounted for
              before the truck leaves the gate.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-white/60">
              — Site Engineer, Joshob Construction Co. Ltd.
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white lg:hidden"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 8H3M7 4 3 8l4 4" />
            </svg>
            Back to home
          </Link>

          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-orange">
            Joshob Construction
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to manage stock, sites, and project consumption.
          </p>

          <form className="mt-10 space-y-5" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@joshobconstruction.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-[0.15em] text-white/60"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-brand-orange transition hover:text-brand-orange-bright"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-white/5"
              />
              Keep me signed in
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-brand-orange px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-orange-deep/40 ring-1 ring-inset ring-white/10 transition hover:bg-brand-orange-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-white/60">
            New here?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-white transition hover:text-brand-orange-bright"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
