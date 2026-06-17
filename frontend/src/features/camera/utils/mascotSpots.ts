export type MascotSpot = {
  top: string
  left?: string
  right?: string
  align: "left" | "right"
}

export const RESULT_MASCOT_SPOTS: MascotSpot[] = [
  { top: "8%", left: "4%", align: "left" },
  { top: "14%", left: "42%", align: "left" },
  { top: "6%", right: "4%", align: "right" },
  { top: "22%", left: "6%", align: "left" },
  { top: "18%", right: "5%", align: "right" },
]

export function pickRandomMascotSpot(seed?: string): MascotSpot {
  if (!seed) {
    return RESULT_MASCOT_SPOTS[Math.floor(Math.random() * RESULT_MASCOT_SPOTS.length)]
  }
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return RESULT_MASCOT_SPOTS[hash % RESULT_MASCOT_SPOTS.length]
}
