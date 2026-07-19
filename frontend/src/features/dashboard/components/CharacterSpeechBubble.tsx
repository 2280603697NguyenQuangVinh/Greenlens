import type { ReactNode } from "react"
import { FF_NUNITO } from "@/utils/constants"

type TailSide = "left" | "right"
type BubbleVariant = "dashboard" | "camera"

function SoftSpeechBubble({
  children,
  className,
  tail = "left",
}: {
  children: ReactNode
  className?: string
  tail?: TailSide
}) {
  const tailSide = tail === "right" ? "right" : "left"

  return (
    <div className={`min-w-0 flex-1 ${className ?? ""}`}>
      <div className="relative">
        <div
          className="relative rounded-[1.35rem] border border-emerald-100/80 bg-white/94 px-5 py-3.5 shadow-[0_6px_24px_rgba(45,106,79,0.1)]"
        >
          <p
            lang="vi"
            className="text-center text-[13px] font-semibold leading-normal tracking-normal antialiased text-green-900 sm:text-[14px]"
            style={{ ...FF_NUNITO, fontWeight: 600 }}
          >
            {children}
          </p>
        </div>
        {/* Soft curved tail — two overlapping circles instead of a sharp point */}
        <div
          className={`absolute bottom-3 flex items-end gap-0 ${
            tailSide === "left" ? "-left-2 flex-row" : "-right-2 flex-row-reverse"
          }`}
          aria-hidden
        >
          <span className="h-3.5 w-3.5 rounded-full border border-emerald-100/70 bg-white/94 shadow-[0_2px_8px_rgba(45,106,79,0.06)]" />
          <span
            className={`-mb-0.5 h-2.5 w-2.5 rounded-full border border-emerald-100/60 bg-white/92 ${
              tailSide === "left" ? "-ml-1.5" : "-mr-1.5"
            }`}
          />
        </div>
      </div>
    </div>
  )
}

export function CharacterSpeechBubble({
  children,
  className = "",
  tail = "left",
  variant: _variant = "dashboard",
}: {
  children: ReactNode
  className?: string
  tail?: TailSide
  variant?: BubbleVariant
}) {
  return (
    <SoftSpeechBubble className={className} tail={tail}>
      {children}
    </SoftSpeechBubble>
  )
}
