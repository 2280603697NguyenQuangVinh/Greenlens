import type { ReactNode } from "react"
import { FF_FREDOKA } from "@/utils/constants"

export function CharacterSpeechBubble({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <div className="relative rounded-[26px] rounded-tl-md border-2 border-black bg-white px-4 py-3 shadow-[0_4px_0_#1b3a1b22]">
        <span
          className="pointer-events-none absolute -left-[13px] top-[42%] block h-0 w-0 -translate-y-1/2 border-y-[11px] border-r-[14px] border-y-transparent border-r-black"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-[9px] top-[42%] block h-0 w-0 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-white"
          aria-hidden
        />
        <div className="text-[17px] font-normal leading-snug text-black" style={FF_FREDOKA}>
          {children}
        </div>
      </div>
    </div>
  )
}
