import type { ReactNode } from "react"
import { getRootUiAsset } from "../uiAssets"

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

const AUTH_LOGO = getRootUiAsset("GreenLens Kids.png")

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#DDF7E8]">
      <div className="px-6 pt-4 pb-3">
        <div className="mx-auto max-w-[300px] rounded-3xl bg-white/60 p-2 shadow-sm">
          <img src={AUTH_LOGO} alt="GreenLens Kids" className="h-36 w-full rounded-2xl object-contain bg-white" />
        </div>
      </div>

      <div className="rounded-t-[2rem] bg-white px-6 pb-8 pt-6 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        <h1 className="text-center text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mb-6 mt-1 text-center text-sm font-medium text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
