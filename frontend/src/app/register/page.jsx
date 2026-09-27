"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { requestRegistrationOtp, verifyRegistrationOtp } from "../../services/api";
import useAuthStore from "../../store/authStore";
import AuthLayout from "../../components/AuthLayout";

export default function RegisterPage() {
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    if (step !== "otp" || resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const validateForm = () => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email address.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (!password || password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      await requestRegistrationOtp({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role: "customer",
      });
      setStep("otp");
      setOtp("");
      setResendTimer(60);
      setSuccessMsg("Verification code sent to your email address.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await requestRegistrationOtp({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role: "customer",
      });
      setOtp("");
      setResendTimer(60);
      setSuccessMsg("A new verification code has been sent.");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (otp.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyRegistrationOtp({
        email: email.trim(),
        otp: otp.trim(),
      });

      login(data);
      localStorage.setItem(
        "mobixa_user",
        JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          loggedInAt: new Date().toISOString(),
        })
      );
      sessionStorage.setItem("just_logged_in", "true");
      window.dispatchEvent(new Event("authChange"));

      setSuccessMsg(`Welcome, ${data.name}! Redirecting...`);
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid or expired verification code.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* ======================================================================= */}
      {/* REGISTER CARD */}
      {/* ======================================================================= */}
      <div className="bg-white text-slate-900 rounded-[32px] p-8 sm:p-12 w-full max-w-[460px] shadow-xl shadow-slate-200/70 border border-slate-100 relative">
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

        {step === "form" && (
          <>
            {/* 2. HEADER TYPOGRAPHY */}
            <div className="text-center mt-5 mb-6">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                Create Account
              </h1>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Join Mobixa for tech and smart devices shopping
              </p>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
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

            {/* 3. FORM FIELDS */}
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="fullName"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2"
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
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              {/* EMAIL ADDRESS */}
              <div>
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 mt-4"
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
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              {/* PHONE NUMBER (SRI LANKA) */}
              <div>
                <label
                  htmlFor="phone"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 mt-4"
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
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 mt-4"
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

              {/* 4. SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1557bf] hover:bg-[#123e91] text-white font-bold py-4 rounded-full text-base tracking-wider shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.99] mt-8 uppercase cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* 5. BOTTOM NAVIGATION */}
            <div className="mt-8 text-center border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#1557bf] font-bold underline underline-offset-4 hover:text-[#123e91] transition-colors ml-1"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="text-center mt-5 mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 uppercase">
                VERIFY YOUR EMAIL
              </h1>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

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

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center"
                >
                  VERIFICATION CODE
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#1557bf] focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-center text-lg tracking-[0.5em] font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1557bf] hover:bg-[#123e91] text-white font-bold py-4 rounded-full text-base shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.99] mt-6 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Create Account</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setSuccessMsg("");
                  setStep("form");
                }}
                className="font-bold text-[#1557bf] hover:underline cursor-pointer"
              >
                Change Details
              </button>
              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleResendOtp}
                className={`flex items-center gap-1.5 font-bold ${
                  resendTimer > 0
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-[#1557bf] hover:underline cursor-pointer"
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
