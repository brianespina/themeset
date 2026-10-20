"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type OAuthProvider = "discord" | "google";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  discord: "Continue with Discord",
  google: "Continue with Google",
};

export function SignInPanel({
  next,
  initialError,
  configured,
}: {
  next: string;
  initialError?: string;
  /** False when NEXT_PUBLIC_SUPABASE_* are unset — see src/lib/supabase/env.ts. */
  configured: boolean;
}) {
  const [pending, setPending] = useState<OAuthProvider | "steam" | null>(null);
  const [error, setError] = useState<string | undefined>(initialError);

  async function signInWith(provider: OAuthProvider) {
    setPending(provider);
    setError(undefined);

    try {
      const supabase = createClient();
      // Supabase sends the browser to the provider, which returns to
      // /auth/callback — that handler exchanges the code and sets the cookies.
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setPending(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in is unavailable.");
      setPending(null);
    }
    // On success the browser navigates away; leave `pending` set so the button
    // stays disabled through the redirect.
  }

  return (
    <div className="w-full max-w-[404px] border border-border bg-surface p-9">
      <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">ThemeSet</div>
      <h1 className="mt-2 font-display text-[30px] leading-tight">Save your sets</h1>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">
        Sign in to keep the loadouts you build, favourite other people&rsquo;s sets, and
        claim a creator profile.
      </p>

      {!configured && (
        <p
          className="mt-5 border border-border-strong px-3 py-2.5 text-[11.5px] text-ink-muted"
          role="status"
        >
          Sign-in isn&rsquo;t configured on this deployment yet —
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are unset.
        </p>
      )}

      {error && (
        <p
          className="mt-5 border px-3 py-2.5 text-[11.5px]"
          style={{ borderColor: "var(--acc)", color: "var(--acc)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2">
        {(["discord", "google"] as OAuthProvider[]).map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={pending !== null || !configured}
            onClick={() => signInWith(provider)}
            className="border border-border-strong px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:border-ink disabled:opacity-40"
          >
            {pending === provider ? "Redirecting…" : PROVIDER_LABEL[provider]}
          </button>
        ))}

        {/* Steam is a plain link, not a Supabase provider: it runs through our
            own OpenID 2.0 handler at /auth/steam. */}
        {configured ? (
          <a
            href={`/auth/steam?next=${encodeURIComponent(next)}`}
            onClick={() => setPending("steam")}
            className="bg-ink px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
          >
            {pending === "steam" ? "Redirecting…" : "Continue with Steam"}
          </a>
        ) : (
          <span className="bg-ink/40 px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-bg/60">
            Continue with Steam
          </span>
        )}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-dim">
        ThemeSet only reads your public profile — your display name and avatar. It
        never gets your inventory, and never your password.
      </p>
    </div>
  );
}
