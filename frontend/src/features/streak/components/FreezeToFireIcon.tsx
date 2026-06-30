import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { FREEZING_ICON, STREAK_ICON } from "@/assets"

export function FreezeToFireIcon({
  play,
  delay,
  compact = false,
}: {
  play: boolean
  delay: number
  compact?: boolean
}) {
  const iconSize = compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6"
  const [showFire, setShowFire] = useState(!play)

  useEffect(() => {
    if (!play) {
      setShowFire(true)
      return
    }
    setShowFire(false)
    const meltMs = 360 + delay * 1000
    const t = window.setTimeout(() => setShowFire(true), meltMs)
    return () => window.clearTimeout(t)
  }, [play, delay])

  if (!showFire) {
    return (
      <motion.img
        src={FREEZING_ICON}
        alt=""
        className="h-full w-full object-contain p-0"
        draggable={false}
        aria-hidden
        initial={{ scale: 1, opacity: 1, rotate: 0 }}
        animate={{ scale: 0.55, opacity: 0, rotate: 14 }}
        transition={{ duration: 0.34, delay, ease: "easeIn" }}
      />
    )
  }

  return (
    <motion.img
      src={STREAK_ICON}
      alt=""
      className={`object-contain ${iconSize}`}
      draggable={false}
      aria-hidden
      initial={play ? { scale: 0.35, opacity: 0, rotate: -10 } : false}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 440,
        damping: 15,
        delay: play ? delay + 0.08 : 0,
      }}
    />
  )
}
