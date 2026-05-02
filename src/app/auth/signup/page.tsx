"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not create your account.");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!signInRes || signInRes.error) {
        setError("Account created — please sign in.");
        router.push("/auth/login");
        return;
      }

      router.push("/portal");
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

          <ul className="space-y-4 text-sm text-white/80">
            {[
              "Track every stock-in and stock-out in real time",
              "Reorder alerts before low stock costs you a sale",
              "Reports your team will actually open",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m2.5 6.5 2.5 2.5L9.5 4" />
                  </svg>
                </span>
                {line}
              </li>
            ))}
          </ul>
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Start running your warehouse on a single source of truth.
          </p>

          <form className="mt-10 space-y-5" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/60"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Ada Lovelace"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/60"
              >
                Work email
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
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                required
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <span>
                I agree to the{" "}
                <a href="#" className="text-white underline-offset-2 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-white underline-offset-2 hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
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
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-white transition hover:text-sky-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
