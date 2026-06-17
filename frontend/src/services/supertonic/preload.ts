import { isSupertonicEnabled } from "@/services/supertonic/config"

let preloadStarted = false

/** Start downloading Supertonic models as early as possible (splash / dashboard). */
export function startSupertonicPreload(): void {
  if (!isSupertonicEnabled() || preloadStarted) return
  preloadStarted = true
  void import("@/services/supertonic/supertonicSpeech").then((mod) => {
    void mod.initSupertonic()
  })
}

/** Call on user tap before entering camera so idle TTS can play immediately. */
export async function unlockSupertonicOnGesture(): Promise<boolean> {
  if (!isSupertonicEnabled()) return false
  const mod = await import("@/services/supertonic/supertonicSpeech")
  return mod.unlockSupertonicAudio()
}
