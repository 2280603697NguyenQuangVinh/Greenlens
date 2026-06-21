import type { ReactNode } from "react"
import { FF_FREDOKA, FF_NUNITO } from "@/utils/constants"

type TailSide = "left" | "right"
type BubbleVariant = "dashboard" | "camera"

export function CharacterSpeechBubble({
  children,
  className = "",
  tail = "left",
  variant = "dashboard",
}: {
  children: ReactNode
  className?: string
  tail?: TailSide
  variant?: BubbleVariant
}) {
  const pointRight = tail === "right"
  const isCamera = variant === "camera"

  const boxClass = isCamera
    ? "relative rounded-[20px] border-2 border-[#2D6A4F]/35 bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(45,106,79,0.12)]"
    : `relative rounded-[26px] border-2 border-black bg-white px-4 py-3 shadow-[0_4px_0_#1b3a1b22] ${
        pointRight ? "rounded-tr-md" : "rounded-tl-md"
      }`

  const textStyle = isCamera ? FF_NUNITO : FF_FREDOKA
  const textClass = isCamera
    ? "text-[13px] font-semibold leading-relaxed text-[#1B4332]"
    : "text-[17px] font-normal leading-snug text-black"

  const tailOuterRight = isCamera ? "border-l-[#95D5B2]" : "border-l-black"
  const tailOuterLeft = isCamera ? "border-r-[#95D5B2]" : "border-r-black"

  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <div className={boxClass}>
        {pointRight ? (
          <>
            <span
              className={`pointer-events-none absolute -right-[13px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[11px] border-l-[14px] border-y-transparent ${tailOuterRight}`}
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
              className={`pointer-events-none absolute -left-[13px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[11px] border-r-[14px] border-y-transparent ${tailOuterLeft}`}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -left-[9px] top-1/2 block h-0 w-0 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-white"
              aria-hidden
            />
          </>
        )}
        <div className={textClass} style={textStyle}>
          {children}
        </div>
      </div>
    </div>
  )
}
