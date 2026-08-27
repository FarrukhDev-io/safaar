"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Save, AlertTriangle, ShieldCheck, ShieldAlert, KeyRound, Copy } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { useAuthStore } from "@/lib/store/auth";
import { QRCodeSVG } from "qrcode.react";
import { adminLogoutAction } from "@/lib/auth/actions";
import { createPortal } from "react-dom";

const settingsSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100),
  busCommissionRate: z.coerce.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  contactEmail: z.string().email("Yaroqli elektron pochta kiriting"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commissionRate: 15,
      busCommissionRate: 10,
      maintenanceMode: false,
      contactEmail: "support@safaar.uz",
    },
  });

  const maintenanceMode = watch("maintenanceMode");

  const { user, login } = useAuthStore();
  
  // 2FA states
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<null | {
    setup_id: string;
    otpauth_url: string;
    secret: string;
    recovery_codes: string[];
    expires_in_seconds: number;
  }>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AdminApi.getSettings()
      .then((data) => {
        if (!cancelled) {
          setValue("commissionRate", Number(data.commissionRate) || 0);
          setValue("busCommissionRate", Number(data.busCommissionRate) || 0);
          setValue("maintenanceMode", data.maintenanceMode);
          setValue("contactEmail", data.contactEmail);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Sozlamalarni yuklab bo'lmadi.");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await AdminApi.updateSettings({
        commissionRate: data.commissionRate.toString(),
        busCommissionRate: data.busCommissionRate.toString(),
        maintenanceMode: data.maintenanceMode,
        contactEmail: data.contactEmail,
      });
      toast.success("Sozlamalar saqlandi!");
    } catch {
      toast.error("Sozlamalarni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
    }
  };

  const handleStart2FASetup = async () => {
    setTwoFALoading(true);
    try {
      const data = await AdminApi.setup2FA();
      setSetupData(data);
      setIs2FASetupOpen(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "2FA sozlashni boshlab bo'lmadi");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || twoFACode.length < 6) return;
    
    setTwoFALoading(true);
    try {
      await AdminApi.confirm2FA(setupData.setup_id, twoFACode);
      toast.success("2FA muvaffaqiyatli yoqildi!");
      if (user) {
        login({ ...user, has2FA: true });
      }
      setIs2FASetupOpen(false);
      setSetupData(null);
      setTwoFACode("");
    } catch (err: any) {
      if (err?.response?.data?.error === 'AUTH_2FA_EXPIRED' || err?.response?.status === 410) {
        toast.error("Vaqt tugadi. Iltimos qaytadan boshlang.");
        setIs2FASetupOpen(false);
        setSetupData(null);
      } else {
        toast.error("Kod noto'g'ri");
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Haqiqatan ham 2FA ni o'chirmoqchimisiz? Barcha sessiyalar, shu jumladan hozirgisi ham yopiladi va qaytadan kirishingiz kerak bo'ladi.")) return;
    
    setTwoFALoading(true);
    try {
      await AdminApi.disable2FA();
      toast.success("2FA o'chirildi. Tizimdan chiqilmoqda...");
      await adminLogoutAction();
      window.location.href = "/login";
    } catch (err) {
      toast.error("2FA ni o'chirib bo'lmadi");
      setTwoFALoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxa olindi");
  };

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-4xl relative">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tizim Sozlamalari</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Platformaning asosiy komissiya foizlari, 2FA va texnik xizmat sozlamalari
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting || fetching} className="flex items-center gap-2">
            {isSubmitting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={16} />}
            Saqlash
          </Button>
        </div>
        {/* Ikki bosqichli tasdiqlash (2FA) */}
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </span>
            Xavfsizlik (2FA)
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-slate-50">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ikki bosqichli tasdiqlash (2FA)</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-lg">
                Google Authenticator yoki Authy yordamida hisobingiz xavfsizligini oshiring.
                Hozirgi holat: <span className={`font-semibold ${user?.has2FA ? 'text-emerald-600' : 'text-red-500'}`}>{user?.has2FA ? "Yoqilgan" : "O'chirilgan"}</span>
              </p>
            </div>
            
            {user?.has2FA ? (
              <Button onClick={handleDisable2FA} disabled={twoFALoading} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                {twoFALoading ? "O'chirilmoqda..." : "2FA ni o'chirish"}
              </Button>
            ) : (
              <Button onClick={handleStart2FASetup} disabled={twoFALoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {twoFALoading ? "Kuting..." : "2FA ni yoqish"}
              </Button>
            )}
          </div>
        </div>

        {/* Moliya */}
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              %
            </span>
            Moliyaviy Sozlamalar
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Mehmonxonalar komissiyasi (%)</label>
              <input
                type="number"
                {...register("commissionRate")}
                className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
              {errors.commissionRate && <p className="text-red-500 text-xs mt-1">{errors.commissionRate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Avtobuslar komissiyasi (%)</label>
              <input
                type="number"
                {...register("busCommissionRate")}
                className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
              {errors.busCommissionRate && <p className="text-red-500 text-xs mt-1">{errors.busCommissionRate.message}</p>}
            </div>
          </div>
        </div>

        {/* Tizim */}
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Settings size={18} />
            </span>
            Tizim Sozlamalari
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Yordam elektron pochtasi</label>
              <input
                type="email"
                {...register("contactEmail")}
                className="w-full max-w-md px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
              {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>}
            </div>
            
            <div className="p-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[var(--danger)] shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--danger)]">Texnik Xizmat Rejimi (Maintenance Mode)</h3>
                <p className="text-xs text-slate-600 mt-1 mb-3">
                  Agar buni yoqsangiz, asosiy sayt barcha foydalanuvchilar va hamkorlar uchun vaqtinchalik o'chiriladi.
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register("maintenanceMode")}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--danger)]"></div>
                  <span className="ml-3 text-sm font-medium text-[var(--text-primary)]">
                    {maintenanceMode ? "Yoqilgan" : "O'chirilgan"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 2FA Setup Modal */}
      {is2FASetupOpen && setupData && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">2FA sozlash</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Hisobingizni himoya qilish uchun quyidagi qadamlarni bajaring.
              </p>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Step 1: App */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2 text-[var(--text-primary)] flex items-center gap-2">
                    <span className="bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                    Ilovani o'rnating va skanerlang
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
                    Google Authenticator yoki Authy ilovasini yuklab oling va QR kodni skanerlang.
                    Agar kamerangiz ishlamasa, ushbu kodni qo'lda kiriting:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-slate-800 font-bold break-all">{setupData.secret}</code>
                    <button onClick={() => copyToClipboard(setupData.secret)} className="text-[var(--primary)] hover:bg-[var(--primary)]/10 p-1.5 rounded transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border-2 border-slate-100 shadow-sm shrink-0 self-start md:self-center">
                  <QRCodeSVG value={setupData.otpauth_url} size={140} />
                </div>
              </div>

              <div className="h-px bg-[var(--border)] w-full" />

              {/* Step 2: Recovery Codes */}
              <div>
                <h3 className="font-semibold text-sm mb-2 text-[var(--text-primary)] flex items-center gap-2">
                  <span className="bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                  Qayta tiklash kodlari (Juda muhim!)
                </h3>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 mb-3 flex items-start gap-3">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Bu kodlarni xavfsiz joyga saqlab qo'ying!</strong> Telefoningizni yo'qotsangiz, faqat shu kodlar yordamida hisobingizga kira olasiz. 
                    Bu sahifani yopgandan keyin ularni <u>qayta ko'rsatib bo'lmaydi</u>.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {setupData.recovery_codes.map((code) => (
                    <div key={code} className="bg-slate-100 border border-slate-200 rounded px-3 py-2 text-center text-sm font-mono text-slate-700">
                      {code}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="secondary" 
                  className="mt-3 text-xs w-full sm:w-auto"
                  onClick={() => copyToClipboard(setupData.recovery_codes.join("\n"))}
                >
                  <Copy size={14} className="mr-2" /> Barcha kodlarni nusxalash
                </Button>
              </div>

              <div className="h-px bg-[var(--border)] w-full" />

              {/* Step 3: Verify */}
              <form onSubmit={handleConfirm2FA}>
                <h3 className="font-semibold text-sm mb-3 text-[var(--text-primary)] flex items-center gap-2">
                  <span className="bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                  Tasdiqlash
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  Authenticator ilovasidagi 6 xonali kodni kiriting.
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-[200px]">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-2.5 text-center tracking-[0.5em] font-mono text-lg rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" disabled={twoFALoading || twoFACode.length < 6} className="h-[46px]">
                    {twoFALoading ? "Tasdiqlanmoqda..." : "Tasdiqlash va Yoqish"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-slate-50 flex justify-end">
              <Button variant="secondary" onClick={() => { setIs2FASetupOpen(false); setSetupData(null); }}>
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
