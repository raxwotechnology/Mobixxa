"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Smartphone, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter your phone number.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const newUser = {
        name: fullName.trim() || "Customer",
        email: email.trim(),
        phone: phone.trim(),
        role: "customer",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("mobixa_user", JSON.stringify(newUser));
      sessionStorage.setItem("just_logged_in", "true");
      window.dispatchEvent(new Event("authChange"));

      setSuccessMsg("Account created successfully! Redirecting...");

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      setErrorMsg("Unable to save session. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 bg-[#f8fafc]">
      {/* ======================================================================= */}
      {/* FIGMA PIXEL-PERFECT REGISTER CARD */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-b from-[#1864d9] via-[#1557bf] to-[#0f46a0] text-white rounded-[40px] p-8 sm:p-12 w-full max-w-[460px] shadow-2xl shadow-blue-600/30 relative border border-white/10">
        {/* Subtle Background Glow Accent */}
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

        {/* 2. HEADER TYPOGRAPHY */}
        <div className="text-center mt-5 mb-6">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white">
            Create Account
          </h1>
          <p className="text-blue-100/90 text-xs mt-2 leading-relaxed">
            Join Mobixa for tech and smart devices shopping
          </p>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
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

        {/* 3. FORM FIELDS */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FULL NAME */}
          <div>
            <label
              htmlFor="fullName"
              className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2"
            >
              FULL NAME
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
            />
          </div>

          {/* EMAIL ADDRESS */}
          <div>
            <label
              htmlFor="email"
              className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2 mt-4"
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
            />
          </div>

          {/* PHONE NUMBER (SRI LANKA) */}
          <div>
            <label
              htmlFor="phone"
              className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2 mt-4"
            >
              PHONE NUMBER(SRI LANKA)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              required
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-blue-200/50 focus:outline-none transition-all"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2 mt-4"
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min.6 Characters"
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

          {/* 4. SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-[#1557bf] font-extrabold py-4 rounded-full text-base tracking-wider shadow-lg shadow-black/10 transition-all transform active:scale-[0.99] mt-8 uppercase cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-[#1557bf] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 5. BOTTOM NAVIGATION */}
        <div className="mt-8 text-center border-t border-white/15 pt-5">
          <p className="text-xs text-blue-100/90">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white font-bold underline underline-offset-4 hover:text-blue-200 transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
