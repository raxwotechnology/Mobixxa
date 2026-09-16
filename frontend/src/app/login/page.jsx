"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const [view, setView] = useState("login"); // 'login' | 'forgot' | 'forgot-success'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const namePart = email.split("@")[0] || "Customer";
      const formattedName =
        namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const user = {
        name: formattedName,
        email: email.trim(),
        role: "customer",
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem("mobixa_user", JSON.stringify(user));
      sessionStorage.setItem("just_logged_in", "true");
      window.dispatchEvent(new Event("authChange"));

      setSuccessMsg("Signed in successfully! Redirecting...");

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      setErrorMsg("Failed to store session. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!recoveryEmail.trim() || !recoveryEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView("forgot-success");
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 bg-[#f8fafc]">
      {/* ======================================================================= */}
      {/* FIGMA PIXEL-PERFECT LOGIN CARD */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-b from-[#1864d9] via-[#1557bf] to-[#0f46a0] text-white rounded-[40px] p-8 sm:p-12 w-full max-w-[440px] shadow-2xl shadow-blue-600/30 relative border border-white/10">
        {/* Subtle Ambient Blur Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* 1. TOP BRAND BADGE */}
        <div className="flex justify-center">
          <div className="bg-white px-5 py-2 rounded-2xl shadow-md inline-flex items-center gap-2.5 mx-auto">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-[#1557bf] leading-none">
                Mobixa
              </span>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider">
                MOBILE SHOP ERP
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* VIEW: LOGIN FORM */}
        {/* ===================================================================== */}
        {view === "login" && (
          <>
            {/* Header Typography */}
            <div className="text-center mt-5 mb-6">
              <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white uppercase">
                WELCOME BACK
              </h1>
              <p className="text-blue-100/90 text-xs mt-2 leading-relaxed max-w-[280px] mx-auto">
                Sign in to continue your tech and smart devices shopping
              </p>
            </div>

            {/* Error / Success Feedback */}
            {errorMsg && (
              <div className="mb-4 bg-rose-500/20 border border-rose-400/40 rounded-xl p-3 text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 text-xs text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* EMAIL ADDRESS */}
              <div>
                <label
                  htmlFor="loginEmail"
                  className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
                />
              </div>

              {/* PASSWORD & FORGOT PASSWORD LINK */}
              <div>
                <div className="flex items-center justify-between mb-2 mt-4">
                  <label
                    htmlFor="loginPassword"
                    className="text-[11px] font-bold text-white/90 uppercase tracking-wider"
                  >
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setView("forgot");
                    }}
                    className="text-xs text-blue-200 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="loginPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-200/70 hover:text-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* SIGN IN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-[#1557bf] font-extrabold py-4 rounded-full text-base shadow-lg shadow-black/10 transition-all transform active:scale-[0.99] mt-8 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#1557bf] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* BOTTOM ACCOUNT SWITCHER */}
            <div className="mt-8 text-center border-t border-white/15 pt-5">
              <p className="text-xs text-blue-100/80">
                Don&apos;t have an account?
                <Link
                  href="/register"
                  className="font-bold text-sky-300 hover:underline cursor-pointer ml-1.5"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* VIEW: FORGOT PASSWORD */}
        {/* ===================================================================== */}
        {view === "forgot" && (
          <>
            <div className="text-center mt-5 mb-6">
              <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white uppercase">
                RESET PASSWORD
              </h1>
              <p className="text-blue-100/90 text-xs mt-2 leading-relaxed">
                Enter your registered email to receive account recovery
                instructions.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/20 border border-rose-400/40 rounded-xl p-3 text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recoveryEmail"
                  className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="recoveryEmail"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-[#1557bf] font-extrabold py-4 rounded-full text-base shadow-lg shadow-black/10 transition-all transform active:scale-[0.99] mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#1557bf] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Recovery Link</span>
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/15 pt-5">
              <p className="text-xs text-blue-100/80">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setView("login");
                  }}
                  className="font-bold text-sky-300 hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          </>
        )}

        {/* ===================================================================== */}
        {/* VIEW: FORGOT PASSWORD SUCCESS */}
        {/* ===================================================================== */}
        {view === "forgot-success" && (
          <div className="text-center mt-5 mb-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center mx-auto text-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
              INSTRUCTIONS SENT!
            </h1>
            <p className="text-blue-100/90 text-xs leading-relaxed max-w-xs mx-auto">
              A password reset link has been dispatched to{" "}
              <strong className="text-white">{recoveryEmail}</strong>. Please
              check your inbox.
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setView("login");
                }}
                className="w-full bg-white hover:bg-slate-100 text-[#1557bf] font-extrabold py-4 rounded-full text-base shadow-lg shadow-black/10 transition-all cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
