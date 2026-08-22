export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden p-4 sm:p-6 select-none">
      {/* Background Orbs & Grid (web-user style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Soft Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
        
        {/* Glowing Ambient Shapes */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[130px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-[130px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
