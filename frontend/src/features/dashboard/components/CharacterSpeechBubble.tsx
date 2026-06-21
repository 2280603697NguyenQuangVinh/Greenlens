import type { ReactNode } from "react"
import { FF_FREDOKA } from "@/utils/constants"

type TailSide = "left" | "right"

export function CharacterSpeechBubble({
  children,
  className = "",
  tail = "left",
}: {
  children: ReactNode
  className?: string
  tail?: TailSide
}) {
  const pointRight = tail === "right"

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <div
        className={`relative rounded-[26px] border-2 border-black bg-white px-4 py-3 shadow-[0_4px_0_#1b3a1b22] ${
          pointRight ? "rounded-tr-md" : "rounded-tl-md"
        }`}
      >
        {pointRight ? (
          <>
            <span
              className="pointer-events-none absolute -right-[13px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[11px] border-l-[14px] border-y-transparent border-l-black"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -right-[9px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[9px] border-l-[11px] border-y-transparent border-l-white"
              aria-hidden
            />
          </>
        ) : (
          <>
            <span
              className="pointer-events-none absolute -left-[13px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[11px] border-r-[14px] border-y-transparent border-r-black"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -left-[9px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-white"
              aria-hidden
            />
          </>
        )}
        <div className="text-[17px] font-normal leading-snug text-black" style={FF_FREDOKA}>
          {children}
        </div>
      </div>
    </div>
  )
}
