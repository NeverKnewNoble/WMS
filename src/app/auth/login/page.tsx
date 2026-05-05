"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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
        <div className="absolute inset-0 bg-linear-to-br from-zinc-950/90 via-zinc-950/60 to-zinc-950/30" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-sky-400 to-emerald-400 text-zinc-950">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7 12 3l9 4v10l-9 4-9-4V7z" />
                <path d="M3 7 12 11l9-4" />
                <path d="M12 11v10" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Warehouse MS
            </span>
          </Link>

          <blockquote className="max-w-md">
            <p className="text-2xl font-medium leading-relaxed text-white">
              &ldquo;Stock counts went from a Friday-night chore to a number we
              trust every hour of the day.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-white/60">
              — Operations Lead, Acme Distribution
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

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in to keep tabs on your warehouse.
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
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
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
                  className="text-xs text-sky-300 transition hover:text-sky-200"
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
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
              className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/20 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-white/60">
            New here?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-white transition hover:text-sky-300"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
