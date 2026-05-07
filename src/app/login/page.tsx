"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      if (rememberMe) localStorage.setItem("admin_remember", "true");
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent" />
      </div>
    );
  }
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 py-8 sm:px-10 sm:py-10">
        {/* Brand row */}
        <div className="deck-brand-row">
          <div className="deck-brand">
            <span className="leaf-logo" />
            GIFTIT · ADMIN PORTAL
          </div>
          <div className="deck-meta">CONFIDENTIAL · INTERNAL ACCESS</div>
        </div>

        {/* Two-column body */}
        <div className="grid flex-1 grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          {/* Left — cover-style hero */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="deck-pill mb-8 self-start">RESTRICTED · STAFF ONLY</div>
            <h1 className="deck-h1 mb-6 max-w-[14ch]">
              Run the <span className="deck-em">marketplace</span> with one
              <span className="deck-em"> dashboard.</span>
            </h1>
            <p className="mb-12 max-w-lg text-base text-gray-500 leading-relaxed sm:text-lg">
              Users, businesses, gift cards, transactions, campaigns — every layer of the
              platform under a single sign-in.
            </p>

            <div className="deck-hero-stats max-w-xl">
              <div className="deck-hero-stat">
                <div className="v">52K</div>
                <div className="l">Users</div>
              </div>
              <div className="deck-hero-stat">
                <div className="v">
                  <span className="sm">$</span>2.4<span className="sm">M</span>
                </div>
                <div className="l">Processed</div>
              </div>
              <div className="deck-hero-stat">
                <div className="v">
                  99.9<span className="sm">%</span>
                </div>
                <div className="l">Uptime</div>
              </div>
              <div className="deck-hero-stat">
                <div className="v">4.8K</div>
                <div className="l">Cards</div>
              </div>
            </div>
          </motion.div>

          {/* Right — sign-in form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center"
          >
            <div className="w-full">
              <div className="deck-section-num">SECTION 01 · SIGN IN</div>
              <h2 className="deck-h2 mb-2">
                Welcome <span className="deck-em">back.</span>
              </h2>
              <p className="mb-8 text-sm text-gray-500">
                Authenticate with your administrator credentials.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Authentication failed</p>
                    <p className="mt-0.5 text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="deck-label mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@giftit.com"
                      autoComplete="email"
                      required
                      className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/15"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="deck-label mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-800 focus:ring-green-700"
                    />
                    <span className="text-sm text-gray-600">Keep me signed in</span>
                  </label>
                  <button type="button" className="text-sm font-semibold text-green-800 hover:text-green-900">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-700/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 rounded-xl border border-gray-200 bg-[#ebf7f0] p-4">
                <p className="text-xs leading-relaxed text-gray-600">
                  This portal is restricted to authorized administrators. All access is logged
                  and monitored. Unauthorized attempts are reported.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-5 text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
          <span>GIFTIT · ADMIN · CONFIDENTIAL</span>
          <span>v1.0 · {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
