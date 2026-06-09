import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  subtitle: string;
}

export function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#d4f5e4] max-w-lg mx-auto">
      <div className="flex-shrink-0 pt-3 pb-3 px-3 flex justify-center">
        <div className="w-64 h-28 rounded-3xl bg-white/70 border border-green-200 flex items-center justify-center text-green-700 font-black text-3xl">
          GreenLens Kids ♻️
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[2rem] px-6 pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <h1 className="text-[1.65rem] font-bold text-slate-800 text-center mb-1">
          Chào các bạn
        </h1>
        <p className="text-center text-slate-500 text-sm font-medium mb-8">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
