import { formatSum } from '@/lib/money';
import { Button } from '@/components/ui/Button';

export function HotelBookingWidget({
  minPriceSum,
  checkInTime,
  checkOutTime,
  dict,
}: {
  minPriceSum: number;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  dict: any;
}) {
  return (
    <aside className="flex h-fit flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl lg:sticky lg:top-24">
      <div>
        <p className="flex items-end gap-1.5 text-3xl font-black tracking-tight text-slate-900">
          {formatSum(minPriceSum)}
          <span className="mb-1 text-base font-normal text-slate-500">
            {dict.perNight}
          </span>
        </p>
      </div>

      <div className="flex flex-col rounded-xl border border-slate-300">
        <div className="flex border-b border-slate-300">
          <div className="flex flex-1 flex-col border-r border-slate-300 p-3">
            <span className="text-[10px] font-bold uppercase text-slate-900">{dict.checkIn || 'CHECK-IN'}</span>
            <span className="text-sm text-slate-500">{checkInTime || 'Add date'}</span>
          </div>
          <div className="flex flex-1 flex-col p-3">
            <span className="text-[10px] font-bold uppercase text-slate-900">{dict.checkOut || 'CHECKOUT'}</span>
            <span className="text-sm text-slate-500">{checkOutTime || 'Add date'}</span>
          </div>
        </div>
        <div className="flex flex-col p-3">
          <span className="text-[10px] font-bold uppercase text-slate-900">Guests</span>
          <span className="text-sm text-slate-500">1 guest</span>
        </div>
      </div>

      <a href="#rooms" id="hotel-original-cta" className="w-full">
        <Button
          variant="accent"
          size="lg"
          className="w-full font-extrabold"
        >
          {dict.selectRoom || 'Check availability'}
        </Button>
      </a>

      <div className="flex justify-center">
        <span className="text-sm text-slate-500">You won't be charged yet</span>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
        <div className="flex justify-between text-base text-slate-600 underline">
          <span>{formatSum(minPriceSum)} x 5 nights</span>
          <span>{formatSum(minPriceSum * 5)}</span>
        </div>
        <div className="flex justify-between text-base text-slate-600 underline">
          <span>Service fee</span>
          <span>{formatSum(10000)}</span>
        </div>
      </div>

      <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-bold text-slate-900">
        <span>Total</span>
        <span>{formatSum(minPriceSum * 5 + 10000)}</span>
      </div>
    </aside>
  );
}
