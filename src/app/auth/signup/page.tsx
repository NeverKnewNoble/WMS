"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { JoshobWordmark } from "@/components/ui_components/wordmark";

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
        <div className="absolute inset-0 bg-linear-to-br from-zinc-950/95 via-zinc-950/70 to-zinc-950/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(226,107,26,0.18),transparent_55%)]" />

        <div
          aria-hidden
          className="bg-hazard pointer-events-none absolute -right-4 top-16 h-1.5 w-44 rotate-[-8deg] opacity-90 shadow-[0_8px_24px_rgba(226,107,26,0.25)]"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="Joshob Construction Co. Ltd." className="inline-flex w-fit">
            <JoshobWordmark size="md" />
          </Link>

          <ul className="space-y-4 text-sm text-white/90">
            {[
              "Every GRN, MRN, and site issue logged in real time",
              "Reorder alerts before a project hits a stockout",
              "Reports your QS and PM will actually open",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange-bright ring-1 ring-inset ring-brand-orange/30">
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
            className="mb-10 inline-flex items-center gap-2 text-sm text-white/95 transition hover:text-white lg:hidden"
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-white/95">
            One source of truth for stock, sites, and project consumption.
          </p>

          <form className="mt-10 space-y-5" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/95"
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/95"
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-[0.15em] text-white/95"
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-white/95">
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
              className="w-full rounded-full bg-brand-orange px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-orange-deep/40 ring-1 ring-inset ring-white/10 transition hover:bg-brand-orange-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-white/95">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-white transition hover:text-brand-orange-bright"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
