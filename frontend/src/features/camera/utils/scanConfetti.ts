import confetti from "canvas-confetti"

export function fireScanConfetti(): void {
  const count = 90
  const defaults = { origin: { y: 0.32 }, zIndex: 9999 }

  confetti({
    ...defaults,
    particleCount: count,
    spread: 72,
    startVelocity: 28,
    colors: ["#52B788", "#FFD166", "#40916C", "#95D5B2", "#F4A261"],
  })

  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: count * 0.4,
      spread: 100,
      scalar: 0.85,
    })
  }, 180)
}
