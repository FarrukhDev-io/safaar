import { ShieldAlert, ArrowRight, FileSearch } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Tizimga Kirish
        </h2>
        <p className="text-sm text-slate-300">
          Telefon raqamingizni kiriting — SMS orqali tasdiqlash kodini yuboramiz.
        </p>
      </div>

      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 px-4 py-3 text-xs text-brand-200 backdrop-blur-md"
      >
        <ShieldAlert
          className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
          aria-hidden
        />
        <p className="leading-relaxed">
          <strong className="text-brand-300 font-semibold">Eslatma:</strong> Avval hamkorlik arizasi yuboriladi, admin tasdiqlagandan so'ng kabinetga kirish imkoni ochiladi.
        </p>
      </div>

      <LoginForm />

      <div className="border-t border-slate-800/80 pt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Hali hamkor emasmisiz?</span>
          <span>Arizangiz bormi?</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/register" className="w-full">
            <button className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700/80 hover:border-slate-600 hover:text-white">
              Ariza berish
              <ArrowRight className="h-3.5 w-3.5 text-brand-400" />
            </button>
          </Link>
          <Link href="/status" className="w-full">
            <button className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:bg-slate-800/60 hover:text-slate-200">
              <FileSearch className="h-3.5 w-3.5 text-indigo-400" />
              Holatni tekshirish
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
