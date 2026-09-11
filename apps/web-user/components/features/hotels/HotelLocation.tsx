import { MapPin } from "lucide-react";

export function HotelLocation() {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
        {/* Mock Map Placeholder */}
        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=41.311081,69.240562&zoom=13&size=800x400&scale=2&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x333333&style=feature:all|element:labels.text.stroke|color:0xffffff&style=feature:landscape|element:geometry|color:0xf5f5f5&style=feature:poi|element:geometry|color:0xeeeeee&style=feature:road.highway|element:geometry|color:0xffffff&style=feature:road.arterial|element:geometry|color:0xffffff&style=feature:road.local|element:geometry|color:0xffffff&style=feature:water|element:geometry|color:0xcbe6a3&client=google-maps-api&signature=mock')] bg-cover bg-center opacity-50 grayscale mix-blend-multiply" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-900">
            Safaar Hotel Location
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-900">International Airport</span>
          </div>
          <span className="text-sm font-bold text-slate-900">5 km</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-900">City Center</span>
          </div>
          <span className="text-sm font-bold text-slate-900">2 km</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-900">Main Train Station</span>
          </div>
          <span className="text-sm font-bold text-slate-900">3.5 km</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-900">Shopping Mall</span>
          </div>
          <span className="text-sm font-bold text-slate-900">1 km</span>
        </div>
      </div>
    </div>
  );
}
