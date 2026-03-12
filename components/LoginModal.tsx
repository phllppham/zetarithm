"use client";

import { useEffect, useRef, useState } from "react";
import GlassCard from "@/components/GlassCard";

type Step = "email" | "verify";

async function getSupabase() {
  const { createClient } = await import("@/lib/supabaseClient");
  return createClient();
}

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  // ── OTP state machine ────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Resend cooldown: counts down from 60 after the OTP email is sent
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up cooldown timer on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ── Step 1: send OTP ─────────────────────────────────────────────────────
  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    const supabase = await getSupabase();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Create the account if it doesn't exist yet (new users sign up this way)
        shouldCreateUser: true,
        // No redirect URL — we verify the 6-digit code manually in-app
        emailRedirectTo: undefined,
      },
    });

    setLoading(false);

    if (otpError) {
      const msg = otpError.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("over_email_send_rate_limit")) {
        setError("Too many code requests. Please wait a few minutes before trying again.");
      } else {
        setError(otpError.message);
      }
      return;
    }

    // Advance to verification step and start 90-second resend cooldown
    setStep("verify");
    setCode("");
    startCooldown();
  };

  const startCooldown = () => {
    setResendCooldown(90);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  // ── Step 2: verify code ──────────────────────────────────────────────────
  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setError(null);
    setLoading(true);

    const supabase = await getSupabase();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmedCode,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      // Surface friendly messages for the most common failures
      if (verifyError.message.toLowerCase().includes("expired")) {
        setError("Code expired. Request a new one below.");
      } else if (
        verifyError.message.toLowerCase().includes("invalid") ||
        verifyError.message.toLowerCase().includes("otp")
      ) {
        setError("Incorrect code. Double-check and try again.");
      } else {
        setError(verifyError.message);
      }
      return;
    }

    // Success — onAuthStateChange in AuthModalProvider picks up the new session.
    onClose();
  };

  // Accept up to 8 digits (Supabase can send 6 or 8 depending on project config)
  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setCode(digits);
    setError(null);
  };

  // ── OAuth ────────────────────────────────────────────────────────────────
  const handleOAuth = async (provider: "github" | "google" | "linkedin_oidc") => {
    setError(null);
    const supabase = await getSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-md px-8 py-9 z-10">
        {/* X close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {step === "email" ? (
          <>
            <h2 className="text-xl font-bold text-white mb-1">Sign in</h2>
            <p className="text-white/40 text-sm mb-7">
              Save your scores and climb the leaderboard.
            </p>

            {/* OAuth buttons */}
            <div className="flex flex-col gap-3 mb-5">
              <button
                onClick={() => handleOAuth("github")}
                className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
              <button
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuth("linkedin_oidc")}
                className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
              >
                <LinkedInIcon />
                Continue with LinkedIn
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/25 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Email form */}
            <form onSubmit={sendOtp} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                required
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/25 focus:bg-white/8 transition-all"
              />

              {error && <p className="text-red-400/80 text-xs px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Sending…" : "Send Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Back arrow */}
            <button
              onClick={() => { setStep("email"); setError(null); setCode(""); }}
              className="absolute top-4 left-4 text-white/30 hover:text-white/70 transition-colors text-sm flex items-center gap-1"
              aria-label="Back"
            >
              ← Back
            </button>

            <h2 className="text-xl font-bold text-white mb-1 mt-4">Check your email</h2>
            <p className="text-white/40 text-sm mb-7">
              We sent a verification code to{" "}
              <span className="text-white/70 font-medium">{email}</span>.
              Enter it below to sign in.
            </p>

            <form onSubmit={verifyCode} className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                maxLength={8}
                autoFocus
                autoComplete="one-time-code"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center tracking-[0.4em] placeholder:text-white/15 placeholder:tracking-[0.05em] outline-none focus:border-white/25 focus:bg-white/8 transition-all"
              />

              {error && <p className="text-red-400/80 text-xs px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>
            </form>

            {/* Resend */}
            <p className="text-center text-white/35 text-xs mt-5">
              Didn&apos;t receive it?{" "}
              {resendCooldown > 0 ? (
                <span className="text-white/25">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={() => sendOtp()}
                  className="text-white/60 underline hover:text-white transition-colors"
                >
                  Resend code
                </button>
              )}
            </p>
            <p className="text-center text-white/20 text-xs mt-2">
              Check your spam folder if it doesn&apos;t arrive.
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
