"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/lib/store/auth";

export default function LogoutPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    logout();
    Cookies.remove("admin_token", { path: "/" });
    localStorage.removeItem("admin-auth-storage");
    router.replace("/login");
  }, [logout, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F1A2E] text-white">
      <div className="flex flex-col items-center gap-3 text-sm text-white/70">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        Sessiya tozalanmoqda
      </div>
    </main>
  );
}
