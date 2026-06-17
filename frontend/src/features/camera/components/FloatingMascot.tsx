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
  spot?: MascotSpot
  mascotSize?: number
  className?: string
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
  spot,
  mascotSize = 72,
  className,
}: FloatingMascotProps) {
  const spokenKeyRef = useRef<string | null>(null)
  const onSpeakRef = useRef(onSpeak)
  const onStopPlaybackRef = useRef(onStopPlayback)
  const supertonicWasReadyRef = useRef(supertonicReady)
  const [entered, setEntered] = useState(false)
  onSpeakRef.current = onSpeak
  onStopPlaybackRef.current = onStopPlayback

  const segmentsFingerprint = speechSegments.map((segment) => segment.text).join("\n")

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

  const isIdle = variant === "idle"
  const alignRight = spot?.align === "right"

  const positionStyle: CSSProperties = isIdle
    ? {}
    : {
        top: spot?.top ?? "10%",
        left: spot?.left,
        right: spot?.right,
      }

  const containerClass =
    className ??
    (isIdle
      ? "pointer-events-none absolute bottom-52 left-3 right-3 z-[60] max-w-[min(100%,22rem)]"
      : "pointer-events-none absolute z-30 max-w-[min(88vw,20rem)]")

  return (
    <motion.div
      key={speechKey}
      initial={{ scale: 0, opacity: 0, y: 28 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      onAnimationComplete={() => setEntered(true)}
      className={containerClass}
      style={isIdle ? undefined : positionStyle}
    >
      <div className={`flex items-end gap-2 ${alignRight ? "flex-row-reverse" : ""}`}>
        <motion.img
          src={mascotPng}
          alt="Mascot"
          className="shrink-0 object-contain drop-shadow-lg"
          style={{ height: mascotSize, width: mascotSize }}
          draggable={false}
          animate={entered ? { y: [0, -4, 0] } : undefined}
          transition={
            entered
              ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
              : undefined
          }
        />
        <CharacterSpeechBubble
          tail={alignRight ? "right" : "left"}
          className={isIdle ? "drop-shadow-lg [&_div]:bg-white/95" : "drop-shadow-md [&_div]:bg-white/95"}
        >
          <p className="text-[15px] leading-snug">{text}</p>
        </CharacterSpeechBubble>
      </div>
    </motion.div>
  )
}
