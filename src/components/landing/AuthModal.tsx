"use client";

import React, { useEffect, useState } from "react";
import { X, Play, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AuthMode = "signin" | "signup" | "verify" | "forgot" | "reset";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthMode;
  initialToken?: string;
  initialEmail?: string;
  onClose: () => void;
}

export function AuthModal({
  isOpen,
  initialMode,
  initialToken,
  initialEmail,
  onClose,
}: AuthModalProps) {
  const router = useRouter();
  const { login, notify } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<"viewer" | "creator">("viewer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync the modal state whenever it reopens (deep links set the initial mode).
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setErrorDetails([]);
      setSuccess(null);
      setLoading(false);
      setPassword("");
      setNewPassword("");
      setVerifyCode("");
      if (initialMode === "reset") setResetToken(initialToken ?? "");
      if (initialEmail) setEmail(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const respondToErrors = (err: unknown) => {
    if (err instanceof ApiError) {
      setError(err.message);
      setErrorDetails(err.details ?? []);
    } else if (err instanceof Error) {
      setError(err.message);
      setErrorDetails([]);
    } else {
      setError("Something went wrong. Please try again.");
      setErrorDetails([]);
    }
  };

  const goToMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setErrorDetails([]);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails([]);
    setLoading(true);

    try {
      if (mode === "signup") {
        const accountType = role === "creator" ? "CREATOR" : "USER";
        await api.register(name, email, password, accountType);
        setLoading(false);
        setSuccess("Account created. Enter the verification code we sent you.");
        setMode("verify");
        return;
      }

      if (mode === "verify") {
        const result = await api.verifyEmail(email, verifyCode);
        setLoading(false);
        setSuccess(result.message);
        setPassword("");
        setMode("signin");
        return;
      }

      if (mode === "forgot") {
        const result = await api.forgotPassword(email);
        setLoading(false);
        setSuccess(result.message);
        return;
      }

      if (mode === "reset") {
        const result = await api.resetPassword(resetToken, newPassword);
        setLoading(false);
        setSuccess(result.message);
        setNewPassword("");
        setResetToken("");
        setMode("signin");
        return;
      }

      // Sign in — role is resolved from the backend, never from the frontend.
      const user = await login(email, password);
      setLoading(false);
      onClose();
      notify("Successfully logged in.");
      if (user.role === "ADMIN") {
        router.replace("/admin");
      } else if (user.role === "CREATOR") {
        router.replace("/creator");
      } else {
        router.replace("/");
        requestAnimationFrame(() =>
          document
            .getElementById("content-library")
            ?.scrollIntoView({ behavior: "smooth" }),
        );
      }
    } catch (err) {
      setLoading(false);
      if (
        err instanceof ApiError &&
        err.status === 403 &&
        /verify/i.test(err.message)
      ) {
        setError("Please verify your email address before signing in.");
        setMode("verify");
      } else {
        respondToErrors(err);
      }
    }
  };

  const submitLabel = {
    signin: "Sign In to EVO",
    signup: "Create EVO Account",
    verify: "Verify & Continue",
    forgot: "Send Reset Link",
    reset: "Reset Password",
  }[mode];

  const title = {
    signin: "Welcome back to EVO",
    signup: "Create your EVO account",
    verify: "Verify your email",
    forgot: "Reset your password",
    reset: "Create a new password",
  }[mode];

  const subtitle = {
    signin: "Sign in to access your personalized library & watch history.",
    signup: "Upload long-form videos. Build your Hub. Grow your network.",
    verify: `Enter the 6-digit confirmation code sent to ${email || "your email"}.`,
    forgot: "Enter your account email and we'll send you a reset link.",
    reset: "Choose a new password for your EVO account.",
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[95vh] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-2xl p-6 sm:p-7 sm:p-8 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-evo-red to-orange-500 flex items-center justify-center text-white shadow-sm shadow-evo-red/30 shrink-0">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-gray-950">
            EVO
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight mb-1 sm:mb-2">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{subtitle}</p>

        {/* Account Type Selector (for SignUp only) */}
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-4 sm:mb-5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setRole("viewer")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                role === "viewer"
                  ? "bg-white text-gray-950 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Streamer / Viewer
            </button>
            <button
              type="button"
              onClick={() => setRole("creator")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                role === "creator"
                  ? "bg-evo-red text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Create Your Hub
            </button>
          </div>
        )}

        {success && (
          <div className="mb-3 sm:mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-start gap-2 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-3 sm:mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs space-y-1 flex-shrink-0">
            <div>{error}</div>
            {errorDetails.length > 0 && (
              <ul className="list-disc list-inside pl-1">
                {errorDetails.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
          {mode === "signup" && (
            <div className="flex-shrink-0">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {(mode === "signin" || mode === "signup" || mode === "forgot" || mode === "verify") && (
            <div className="flex-shrink-0">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {(mode === "signin" || mode === "signup") && (
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => goToMode("forgot")}
                    className="text-[11px] text-evo-red hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>
              {mode === "signup" && (
                <p className="text-[10px] text-gray-400 mt-1.5">
                  At least 8 characters with an uppercase letter, a lowercase letter and a number.
                </p>
              )}
            </div>
          )}

          {mode === "reset" && (
            <div className="flex-shrink-0">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                At least 8 characters with an uppercase letter, a lowercase letter and a number.
              </p>
            </div>
          )}

          {mode === "verify" && (
            <div className="space-y-4 flex-shrink-0">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <Mail className="w-6 h-6 text-evo-red mx-auto mb-2" />
                <div className="text-xs font-bold text-gray-900">
                  Email Verification
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Enter the 6-digit confirmation code sent to{" "}
                  {email || "your email"}.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-evo-red focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setErrorDetails([]);
                  setLoading(true);
                  try {
                    const result = await api.resendVerification(email);
                    setSuccess(result.message);
                  } catch (err) {
                    respondToErrors(err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full text-[11px] text-evo-red hover:underline"
              >
                Resend verification code
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 sm:mt-2 bg-evo-red hover:bg-evo-red-hover disabled:opacity-60 text-white text-sm font-bold py-2.5 sm:py-3 rounded-xl shadow-evo-button transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>{submitLabel}</span>
          </button>
        </form>

        {/* Mode toggling links */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 text-center text-xs text-gray-500 flex-shrink-0">
          {mode === "signin" && (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => goToMode("signup")}
                className="text-evo-red font-bold hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
          {mode === "signup" && (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => goToMode("signin")}
                className="text-evo-red font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          )}
          {(mode === "verify" || mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => goToMode("signin")}
              className="text-evo-red font-bold hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}