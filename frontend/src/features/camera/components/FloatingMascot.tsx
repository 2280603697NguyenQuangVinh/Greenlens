import { useEffect, useRef, useState, type CSSProperties } from "react"
import { motion } from "motion/react"
import { CharacterSpeechBubble } from "@/features/dashboard/components/CharacterSpeechBubble"
import type { SpeechSegment } from "@/utils/browserSpeech"
import mascotPng from "@/assets/Character/mascot/mascot.png"
import type { MascotSpot } from "@/features/camera/utils/mascotSpots"

type FloatingMascotProps = {
  text: string
  speechSegments: SpeechSegment[]
  speechKey: string
  isSupported: boolean
  voicesReady?: boolean
  supertonicReady?: boolean
  onSpeak: (segments: SpeechSegment[]) => Promise<boolean>
  onStopPlayback?: () => void
  autoSpeak?: boolean
  variant: "idle" | "result"
  layout?: "overlay" | "inline"
  spot?: MascotSpot
  mascotSize?: number
  className?: string
  pointDown?: boolean
}

export function FloatingMascot({
  text,
  speechSegments,
  speechKey,
  isSupported,
  voicesReady = true,
  supertonicReady = false,
  onSpeak,
  onStopPlayback,
  autoSpeak = true,
  variant,
  layout = "overlay",
  spot,
  mascotSize = 72,
  className,
  pointDown = false,
}: FloatingMascotProps) {
  const spokenKeyRef = useRef<string | null>(null)
  const onSpeakRef = useRef(onSpeak)
  const onStopPlaybackRef = useRef(onStopPlayback)
  const supertonicWasReadyRef = useRef(supertonicReady)
  const [entered, setEntered] = useState(false)
  onSpeakRef.current = onSpeak
  onStopPlaybackRef.current = onStopPlayback

  const segmentsFingerprint = speechSegments.map((segment) => segment.text).join("\n")
  const isIdle = variant === "idle"
  const isResult = variant === "result"
  const isInline = layout === "inline"

  useEffect(() => {
    setEntered(false)
    spokenKeyRef.current = null
  }, [speechKey])

  useEffect(() => {
    if (supertonicReady && !supertonicWasReadyRef.current) {
      spokenKeyRef.current = null
    }
    supertonicWasReadyRef.current = supertonicReady
  }, [supertonicReady])

  useEffect(() => {
    if (!autoSpeak || !isSupported || !voicesReady || !text || speechSegments.length === 0) {
      return
    }

    const dedupeKey = `${speechKey}:${segmentsFingerprint}`
    if (spokenKeyRef.current === dedupeKey) return

    let cancelled = false
    void onSpeakRef.current(speechSegments).then((played) => {
      if (!cancelled && played) {
        spokenKeyRef.current = dedupeKey
      }
    })

    return () => {
      cancelled = true
    }
  }, [autoSpeak, isSupported, voicesReady, speechKey, segmentsFingerprint, speechSegments, text])

  useEffect(() => {
    if (variant !== "idle") return
    return () => {
      onStopPlaybackRef.current?.()
    }
  }, [variant])

  const alignRight = spot?.align === "right"

  const positionStyle: CSSProperties =
    isIdle || isInline
      ? {}
      : className?.includes("left-3") && className?.includes("right-3")
        ? { top: spot?.top ?? "8%", left: "12px", right: "12px" }
        : {
            top: spot?.top ?? "10%",
            left: spot?.left,
            right: spot?.right,
          }

  const containerClass =
    className ??
    (isInline
      ? "mb-3 w-full"
      : isIdle
        ? "pointer-events-none absolute bottom-52 left-3 right-3 z-[60] max-w-[min(100%,22rem)]"
        : "pointer-events-none absolute z-30 max-w-[min(calc(100vw-20px),26rem)]")

  const rowAlign =
    isInline ? "items-start" : isResult ? "items-center" : "items-end"

  return (
    <motion.div
      key={speechKey}
      initial={isInline ? { opacity: 0, y: 12 } : { scale: 0, opacity: 0, y: 28 }}
      animate={isInline ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      onAnimationComplete={() => setEntered(true)}
      className={containerClass}
      style={isIdle || isInline ? undefined : positionStyle}
    >
      <div
        className={`relative flex shrink-0 gap-1.5 ${rowAlign} ${alignRight ? "flex-row-reverse" : ""}`}
      >
        <motion.img
          src={mascotPng}
          alt="Mascot"
          className="shrink-0 self-center object-contain drop-shadow-lg"
          style={{ height: mascotSize, width: mascotSize }}
          draggable={false}
          initial={isResult ? { scale: 0.6, rotate: -8 } : false}
          animate={
            entered
              ? isResult
                ? { scale: [1, 1.05, 1], rotate: 0 }
                : { y: [0, -4, 0] }
              : undefined
          }
          transition={
            entered
              ? isResult
                ? { repeat: 2, duration: 0.45, ease: "easeOut" }
                : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
              : undefined
          }
        />
        <CharacterSpeechBubble
          tail={alignRight ? "right" : "left"}
          className={
            isResult
              ? `self-center drop-shadow-lg [&>div:first-child]:bg-white ${isInline ? "min-w-0 flex-1" : ""}`
              : isIdle
                ? "drop-shadow-lg [&>div:first-child]:bg-white/95"
                : "drop-shadow-md [&>div:first-child]:bg-white/95"
          }
        >
          <p
            className={`leading-snug font-bold ${
              isResult
                ? isInline
                  ? "max-h-[88px] overflow-y-auto text-[13px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : "text-[13px] sm:text-[14px]"
                : "text-[15px]"
            }`}
          >
            {text}
          </p>
        </CharacterSpeechBubble>
      </div>

      {pointDown && !isInline && (
        <motion.div
          className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        >
          <span className="text-2xl drop-shadow-md">👇</span>
        </motion.div>
      )}
    </motion.div>
  )
}
