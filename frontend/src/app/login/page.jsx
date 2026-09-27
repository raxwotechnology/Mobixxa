"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { loginUser } from "../../services/api";
import useAuthStore from "../../store/authStore";
import AuthLayout from "../../components/AuthLayout";

const STAFF_REDIRECT_MAP = {
  admin: "/admin",
  manager: "/manager",
  cashier: "/employee",
  deliveryGuy: "/delivery",
  stockEmployee: "/employee",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLoginSubmit = async (e) => {
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
      const { data } = await loginUser({ email: email.trim(), password });
      login(data);

      // Keep the customer storefront (cart/dashboard) aware of the session too.
      localStorage.setItem(
        "mobixa_user",
        JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          loggedInAt: new Date().toISOString(),
        })
      );
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      sessionStorage.setItem("just_logged_in", "true");
      window.dispatchEvent(new Event("authChange"));

      setSuccessMsg(`Welcome back, ${data.name}! Redirecting...`);

      const destination = STAFF_REDIRECT_MAP[data.role] || "/";
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Invalid email or password."
      );
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* ======================================================================= */}
      {/* LOGIN CARD */}
      {/* ======================================================================= */}
      <div className="bg-white text-slate-900 rounded-[32px] p-8 sm:p-12 w-full max-w-[440px] shadow-xl shadow-slate-200/70 border border-slate-100 relative">
        {/* Brand badge — shown only where the side brand panel is hidden */}
        <div className="flex justify-center lg:hidden">
          <div className="bg-blue-50 px-5 py-2 rounded-2xl inline-flex items-center gap-2.5 mx-auto">
            <div className="w-6 h-6 rounded-lg bg-[#1557bf] flex items-center justify-center text-white shadow-xs">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[#1557bf] leading-none">
                Mobixa
              </span>
              <span className="text-xs font-bold text-slate-400 tracking-wider">
                MOBILE SHOP ERP
              </span>
            </div>
          </div>
        </div>

        {/* Header Typography */}
        <div className="text-center mt-5 mb-6">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 uppercase">
            WELCOME BACK
          </h1>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-[280px] mx-auto">
            Sign in to continue your tech and smart devices shopping
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* EMAIL ADDRESS */}
          <div>
            <label
              htmlFor="loginEmail"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2"
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
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* PASSWORD & FORGOT PASSWORD LINK */}
          <div>
            <div className="flex items-center justify-between mb-2 mt-4">
              <label
                htmlFor="loginPassword"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                PASSWORD
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#1557bf] hover:underline cursor-pointer"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
            className="w-full bg-[#1557bf] hover:bg-[#123e91] text-white font-bold py-4 rounded-full text-base shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.99] mt-8 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* BOTTOM ACCOUNT SWITCHER */}
        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?
            <Link
              href="/register"
              className="font-bold text-[#1557bf] hover:underline cursor-pointer ml-1.5"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
