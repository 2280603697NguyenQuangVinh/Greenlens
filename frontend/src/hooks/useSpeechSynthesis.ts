import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeechSegment } from "@/utils/browserSpeech"
import { buildMascotVoiceText, type MascotVoicePayload } from "@/services/aiCamera"
import { isSupertonicEnabled } from "@/services/supertonic/config"
import { startSupertonicPreload } from "@/services/supertonic/preload"

const BROWSER_SPEECH_ON = typeof window !== "undefined" && "speechSynthesis" in window
const SPEECH_UNLOCK_TEXT = " "

function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  if (!BROWSER_SPEECH_ON) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("vi-vn")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("vi")) ??
    null
  )
}

export function useSpeechSynthesis() {
  const supertonicOn = isSupertonicEnabled()
  const [isSupported] = useState(() => supertonicOn || BROWSER_SPEECH_ON)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [supertonicReady, setSupertonicReady] = useState(false)
  const [supertonicLoading, setSupertonicLoading] = useState(supertonicOn)
  const [supertonicFailed, setSupertonicFailed] = useState(false)
  const [browserVoicesReady, setBrowserVoicesReady] = useState(() => {
    if (!BROWSER_SPEECH_ON) return false
    return window.speechSynthesis.getVoices().length > 0
  })

  const supertonicRef = useRef<Awaited<
    ReturnType<typeof import("@/services/supertonic")>
  > | null>(null)

  const voicesReady = supertonicOn ? supertonicReady : browserVoicesReady

  const setSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking)
  }, [])

  const loadSupertonic = useCallback(async () => {
    if (!supertonicOn) return null
    if (!supertonicRef.current) {
      supertonicRef.current = await import("@/services/supertonic")
    }
    return supertonicRef.current
  }, [supertonicOn])

  const cancelPlayback = useCallback(() => {
    if (supertonicOn) {
      void loadSupertonic().then((mod) => mod?.cancelSupertonicPlayback())
    }
    if (BROWSER_SPEECH_ON) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [loadSupertonic, setSpeaking, supertonicOn])

  const cancel = useCallback(() => {
    if (supertonicOn) {
      void loadSupertonic().then((mod) => mod?.cancelSupertonicSpeech())
    }
    if (BROWSER_SPEECH_ON) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [loadSupertonic, setSpeaking, supertonicOn])

  const speakBrowserText = useCallback(
    async (text: string): Promise<boolean> => {
      if (!BROWSER_SPEECH_ON || !text.trim()) return false

      return new Promise<boolean>((resolve) => {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text.trim())
        utterance.lang = "vi-VN"
        utterance.rate = 0.95
        utterance.pitch = 1
        utterance.volume = 1

        const viVoice = pickVietnameseVoice()
        if (viVoice) utterance.voice = viVoice

        let done = false
        const finalize = (played: boolean) => {
          if (done) return
          done = true
          setSpeaking(false)
          resolve(played)
        }

        utterance.onstart = () => setSpeaking(true)
        utterance.onend = () => finalize(true)
        utterance.onerror = () => finalize(false)

        try {
          window.speechSynthesis.resume()
          window.speechSynthesis.speak(utterance)
        } catch {
          finalize(false)
        }
      })
    },
    [setSpeaking],
  )

  const unlockAudio = useCallback(async () => {
    if (supertonicOn) {
      const supertonic = await loadSupertonic()
      if (supertonic) {
        const unlocked = await supertonic.unlockSupertonicAudio()
        if (unlocked) return true
      }
    }

    if (!BROWSER_SPEECH_ON) return false

    return new Promise<boolean>((resolve) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(SPEECH_UNLOCK_TEXT)
      utterance.lang = "vi-VN"
      utterance.volume = 0
      utterance.rate = 1
      utterance.pitch = 1

      let done = false
      const finish = (ok: boolean) => {
        if (done) return
        done = true
        resolve(ok)
      }

      utterance.onend = () => finish(true)
      utterance.onerror = () => finish(false)

      try {
        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utterance)
        window.setTimeout(() => finish(true), 220)
      } catch {
        finish(false)
      }
    })
  }, [loadSupertonic, supertonicOn])

  const speak = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      const queue = segments
        .map((segment) => ({
          text: segment.text.trim(),
          lang: segment.lang === "en" ? "en" : "vi",
        }))
        .filter((segment) => segment.text)

      if (!queue.length) return false

      if (supertonicOn && !supertonicFailed) {
        const supertonic = await loadSupertonic()
        if (supertonic) {
          const played = await supertonic.speakSupertonicSegments(queue, {
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
            onError: () => setSpeaking(false),
          })
          if (played) return true
        }
      }

      const text = queue
        .map((segment) => segment.text)
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim()

      return speakBrowserText(text)
    },
    [loadSupertonic, setSpeaking, speakBrowserText, supertonicFailed, supertonicOn],
  )

  const playMascotVoice = useCallback(
    async (apiResponse: MascotVoicePayload): Promise<boolean> => {
      const text = buildMascotVoiceText(apiResponse)
      if (!text.trim()) return false

      if (supertonicOn && !supertonicFailed) {
        const supertonic = await loadSupertonic()
        if (supertonic) {
          const played = await supertonic.speakSupertonicText(
            text,
            {
              onStart: () => setSpeaking(true),
              onEnd: () => setSpeaking(false),
              onError: () => setSpeaking(false),
            },
            { lang: "vi" },
          )
          if (played) return true
        }
      }

      return speakBrowserText(text)
    },
    [loadSupertonic, setSpeaking, speakBrowserText, supertonicFailed, supertonicOn],
  )

  useEffect(() => {
    if (!supertonicOn) return

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
  }, [loadSupertonic, supertonicOn])

  useEffect(() => {
    if (!BROWSER_SPEECH_ON || supertonicOn) return
    const updateVoices = () => {
      setBrowserVoicesReady(window.speechSynthesis.getVoices().length > 0)
    }
    updateVoices()
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices)
  }, [supertonicOn])

  const replay = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      await unlockAudio()
      return speak(segments)
    },
    [speak, unlockAudio],
  )

  useEffect(() => {
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
    playMascotVoice,
    replay,
    cancel,
    cancelPlayback,
  }
}
