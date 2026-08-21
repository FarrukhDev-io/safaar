import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { api } from "@/lib/api";
import { formatSum } from "@/lib/money";
import { Card, CardBody } from "@/components/ui/Card";
import { RotateCcw } from "lucide-react";
import type { RefundStatus } from "@/lib/services/refunds/refunds";

const STATUS_STYLES: Record<RefundStatus, string> = {
  requested: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function AccountRefundsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [session, dict] = await Promise.all([
    getSession(),
    getDictionary(locale, "account"),
  ]);

  if (!session) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/account/refunds`)}`,
    );
  }

  const refunds = await api.refunds.getMyRefunds({ token: session.accessToken });
  const statusLabels = dict.refunds.statuses as Record<RefundStatus, string>;

  function formatDate(value: string): string {
    const ts = Date.parse(value);
    return Number.isFinite(ts) ? new Date(ts).toLocaleDateString("uz-UZ") : value;
  }

  if (refunds.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
          <RotateCcw className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{dict.refunds.empty}</p>
          <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{dict.refunds.emptyHint}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{dict.refunds.title}</h2>
        <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {refunds.map((refund) => (
            <li key={refund.id} className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[refund.status] ?? STATUS_STYLES.requested}`}
                >
                  {statusLabels[refund.status] ?? refund.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(refund.createdAt)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{dict.refunds.requestedAmount}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatSum(refund.requestedAmount)}
                  </span>
                </div>
                {refund.approvedAmount !== null && (
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{dict.refunds.approvedAmount}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatSum(refund.approvedAmount)}
                    </span>
                  </div>
                )}
                {refund.reason && (
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{dict.refunds.reason}</span>
                    <span className="text-slate-700 dark:text-slate-300">{refund.reason}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/${locale}/booking/${refund.bookingId}`}
                className="w-fit text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                {dict.refunds.viewBooking}
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
