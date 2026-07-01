import type { ReactNode } from "react"
import { SPEECH_BUBBLE_RIGHT } from "@/assets/iconAssets"
import { FF_NUNITO } from "@/utils/constants"

type TailSide = "left" | "right"
type BubbleVariant = "dashboard" | "camera"

function ImageSpeechBubble({
  children,
  className,
  tail = "left",
}: {
  children: ReactNode
  className?: string
  tail?: TailSide
}) {
  const flip = tail === "right"

  return (
    <div className={`min-w-0 flex-1 ${className ?? ""}`}>
      <div
        className={`relative w-full drop-shadow-[0_3px_10px_rgba(45,106,79,0.15)] ${flip ? "-scale-x-100" : ""}`}
      >
        <img
          src={SPEECH_BUBBLE_RIGHT}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          draggable={false}
          aria-hidden
        />
        <div
          className={`relative flex min-h-[3.25rem] items-center justify-center px-4 pb-[1.2rem] pt-2.5 ${flip ? "-scale-x-100" : ""}`}
        >
          <p
            lang="vi"
            className="text-center text-[13px] font-semibold leading-normal tracking-normal antialiased text-black sm:text-[14px]"
            style={{ ...FF_NUNITO, fontWeight: 600 }}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}

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
  return (
    <ImageSpeechBubble className={className} tail={tail}>
      {children}
    </ImageSpeechBubble>
  )
}
