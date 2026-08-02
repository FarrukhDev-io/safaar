"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Lock, User } from "lucide-react";
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
      Cookies.set("admin_token", data.token, { expires: 1, path: "/" });
      login(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] mb-4 shadow-lg shadow-[var(--accent)]/20">
          <Shield className="text-white" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-white">Safaar Admin</h1>
        <p className="text-white/50 text-sm mt-1">Boshqaruv paneliga kirish</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 shadow-2xl">
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Login</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/40 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Parol</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-dark)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Kirish"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-white/20 text-xs mt-6">
        © 2026 Safaar.uz — Barcha huquqlar himoyalangan
      </p>
    </div>
  );
}
