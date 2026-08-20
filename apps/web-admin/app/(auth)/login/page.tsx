"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Lock, User, KeyRound, ArrowLeft } from "lucide-react";
import { adminLoginAction, adminVerify2FAAction } from "../../../lib/auth/actions";
import { useAuthStore } from "../../../lib/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();

  // 2FA state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Login va parolni kiriting");
      return;
    }

    setLoading(true);
    try {
      const result = await adminLoginAction(username, password);

      if ("error" in result) {
        setError(result.error);
      } else if (result.requires2FA) {
        setChallengeId(result.challengeId);
      } else {
        login(result.user);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otpCode.length < 6) {
      setError("6 xonali kodni kiriting");
      return;
    }

    setLoading(true);
    try {
      const result = await adminVerify2FAAction(challengeId!, otpCode);
      if (result.ok) {
        login(result.user);
        router.push("/dashboard");
      } else if (result.expired) {
        setError(result.error);
        setChallengeId(null);
        setOtpCode("");
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Brand Header */}
      <div className="text-center flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4">
          <Shield size={30} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          Safaar Admin <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Control Center</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-medium">Platformani boshqarish va nazorat paneli</p>
      </div>

      {/* Clean White Card */}
      <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        {!challengeId ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Admin Logini</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Maxfiy Parol</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Boshqaruv Paneliga Kirish"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="flex flex-col gap-5 animate-fade-in">
            <div className="text-center mb-1">
              <p className="text-slate-900 font-bold text-base">2FA Ikki Bosqichli Tasdiqlash</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Authenticator ilovasidagi 6 xonali maxfiy kodni kiriting</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-3.5 text-center tracking-[0.5em] text-xl font-bold rounded-xl bg-slate-50 border border-blue-300 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 focus:bg-white transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-center font-semibold">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Kodni Tasdiqlash"
                )}
              </button>
              
              <button
                type="button"
                onClick={() => { setChallengeId(null); setOtpCode(""); setError(""); }}
                className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={14} /> Ortga qaytish
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Badge */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-medium">
          <span className="flex items-center gap-1 text-slate-600">
            🔒 256-bit SSL Himoyalangan
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Tizim Faol
          </span>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="text-center text-slate-500 text-xs font-medium">
        © {new Date().getFullYear()} Safaar Platform — Admin Control Center
      </p>
    </div>
  );
}
