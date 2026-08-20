"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Lock, User, KeyRound, ArrowLeft } from "lucide-react";
import Cookies from "js-cookie";
import { AdminApi } from "../../../lib/api/admin-api";
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
      const data = await AdminApi.login(username, password);
      
      if (data.requires2FA) {
        setChallengeId(data.challengeId!);
      } else if (data.token && data.user) {
        Cookies.set("admin_token", data.token, { expires: 1, path: "/" });
        login(data.user);
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
      const data = await AdminApi.verify2FA(challengeId!, otpCode);
      Cookies.set("admin_token", data.token, { expires: 1, path: "/" });
      login(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      if (err?.response?.status === 401 && err?.response?.data?.error === 'AUTH_2FA_EXPIRED') {
        setError("Vaqt tugadi, qaytadan kiring");
        setChallengeId(null);
        setOtpCode("");
      } else {
        setError("Kod noto'g'ri");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Brand Header */}
      <div className="text-center flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 blur-xl opacity-60 animate-pulse" />
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-white/20 text-cyan-400 shadow-2xl shadow-cyan-500/20">
            <Shield size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          Safaar Admin <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Executive</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Boshqaruv va nazorat markaziga kirish</p>
      </div>

      {/* Glassmorphic Login Card */}
      <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-black/50">
        {!challengeId ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin Logini</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Maxfiy Parol</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
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
              <p className="text-white font-semibold text-base">2FA Ikki Bosqichli Tasdiqlash</p>
              <p className="text-slate-400 text-xs mt-1">Authenticator ilovasidagi 6 xonali maxfiy kodni kiriting</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-3.5 text-center tracking-[0.5em] text-xl font-bold rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={14} /> Ortga qaytish
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            🔒 256-bit SSL Himoyalangan
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Control Tower Online
          </span>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="text-center text-slate-500 text-xs">
        © {new Date().getFullYear()} Safaar Platform — Admin Control Center
      </p>
    </div>
  );
}
