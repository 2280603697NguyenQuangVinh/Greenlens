import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeechSegment } from "@/utils/browserSpeech"
import { startSupertonicPreload } from "@/services/supertonic/preload"

const SUPERTONIC_ON =
  import.meta.env.VITE_USE_SUPERTONIC_TTS === "true" &&
  import.meta.env.VITE_USE_MOCK !== "true"

export function useSpeechSynthesis() {
  const [isSupported] = useState(() => SUPERTONIC_ON)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [supertonicReady, setSupertonicReady] = useState(false)
  const [supertonicLoading, setSupertonicLoading] = useState(SUPERTONIC_ON)
  const [supertonicFailed, setSupertonicFailed] = useState(false)
  const supertonicRef = useRef<Awaited<
    ReturnType<typeof import("@/services/supertonic")>
  > | null>(null)

  const voicesReady = supertonicReady

  const setSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking)
  }, [])

  const loadSupertonic = useCallback(async () => {
    if (!SUPERTONIC_ON) return null
    if (!supertonicRef.current) {
      supertonicRef.current = await import("@/services/supertonic")
    }
    return supertonicRef.current
  }, [])

  const cancelPlayback = useCallback(() => {
    supertonicRef.current?.cancelSupertonicPlayback()
    setSpeaking(false)
  }, [setSpeaking])

  const cancel = useCallback(() => {
    supertonicRef.current?.cancelSupertonicSpeech()
    setSpeaking(false)
  }, [setSpeaking])

  const unlockAudio = useCallback(async () => {
    if (!SUPERTONIC_ON) return false
    const supertonic = await loadSupertonic()
    if (!supertonic) return false
    return supertonic.unlockSupertonicAudio()
  }, [loadSupertonic])

  const speak = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      if (!SUPERTONIC_ON || segments.length === 0 || supertonicFailed) {
        return false
      }

      const queue = segments
        .map((segment) => ({
          text: segment.text.trim(),
          lang: segment.lang === "en" ? "en" : "vi",
        }))
        .filter((segment) => segment.text)

      if (!queue.length) return false

      const supertonic = await loadSupertonic()
      if (!supertonic) return false

      return supertonic.speakSupertonicSegments(queue, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      })
    },
    [loadSupertonic, setSpeaking, supertonicFailed],
  )

  useEffect(() => {
    if (!SUPERTONIC_ON) return

    startSupertonicPreload()

    let unsubscribe: (() => void) | undefined

    void loadSupertonic().then((supertonic) => {
      if (!supertonic) return
      unsubscribe = supertonic.subscribeSupertonicInit((state) => {
        setSupertonicLoading(state.loading)
        if (state.ready) {
          setSupertonicReady(true)
          setSupertonicFailed(false)
        }
        if (state.error && !state.loading) {
          setSupertonicFailed(true)
          setSupertonicReady(false)
        }
      })
    })

    return () => unsubscribe?.()
  }, [loadSupertonic])

  const replay = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      await unlockAudio()
      return speak(segments)
    },
    [speak, unlockAudio],
  )

  useEffect(() => {
    if (!SUPERTONIC_ON) return
    return () => cancelPlayback()
  }, [cancelPlayback])

  return {
    isSupported,
    isSpeaking,
    voicesReady,
    supertonicLoading,
    supertonicReady,
    supertonicFailed,
    unlockAudio,
    speak,
    replay,
    cancel,
    cancelPlayback,
  }
}
