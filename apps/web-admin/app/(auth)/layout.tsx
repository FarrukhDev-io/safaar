export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden p-4 sm:p-6 select-none">
      {/* Background Cyber Mesh & Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Glowing Orbs */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-gradient-to-br from-indigo-600/30 to-sky-500/20 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] bg-gradient-to-tr from-cyan-600/25 to-emerald-500/20 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
