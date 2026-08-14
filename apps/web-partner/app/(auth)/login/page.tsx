import { Info } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Button } from '../../_components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Tizimga kirish</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Telefon raqamingizni kiriting — SMS orqali tasdiqlash kodini yuboramiz.
        </p>
      </div>

      <div
        role="status"
        className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900 dark:bg-brand-900/30 dark:text-brand-200"
      >
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700 dark:text-brand-300"
          aria-hidden
        />
        <p>
          <strong>Access:</strong> avval hamkorlik arizasi yuboriladi, admin
          tasdiqlagandan keyin kabinet ochiladi.
        </p>
      </div>

      <LoginForm />

      <div className="border-t border-[var(--border)] pt-4 text-center">
        <p className="mb-3 text-sm text-[var(--muted-foreground)]">
          Hali access yo'qmi?
        </p>
        <Link href="/register">
          <Button variant="outline" className="w-full">
            Hamkorlik arizasini yuborish
          </Button>
        </Link>
        <Link href="/status" className="block mt-3">
          <Button variant="ghost" className="w-full text-[var(--muted-foreground)]">
            Ariza holatini tekshirish
          </Button>
        </Link>
      </div>
    </div>
  );
}
