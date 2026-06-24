import { useCallback, useEffect, useState } from "react"
import type { SpeechSegment } from "@/utils/browserSpeech"
import { buildMascotVoiceText, type MascotVoicePayload } from "@/services/aiCamera"

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
  const [isSupported] = useState(() => BROWSER_SPEECH_ON)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voicesReady, setVoicesReady] = useState(() => {
    if (!BROWSER_SPEECH_ON) return false
    return window.speechSynthesis.getVoices().length > 0
  })

  const setSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking)
  }, [])

  const cancelPlayback = useCallback(() => {
    if (!BROWSER_SPEECH_ON) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [setSpeaking])

  const cancel = useCallback(() => {
    if (!BROWSER_SPEECH_ON) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [setSpeaking])

  const speakText = useCallback(
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
  }, [])

  const speak = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      const text = segments
        .map((segment) => segment.text.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim()

      return speakText(text)
    },
    [speakText],
  )

  const playMascotVoice = useCallback(
    async (apiResponse: MascotVoicePayload): Promise<boolean> => {
      const text = buildMascotVoiceText(apiResponse)
      return speakText(text)
    },
    [speakText],
  )

  useEffect(() => {
    if (!BROWSER_SPEECH_ON) return
    const updateVoices = () => {
      setVoicesReady(window.speechSynthesis.getVoices().length > 0)
    }
    updateVoices()
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices)
  }, [])

  const replay = useCallback(
    async (segments: SpeechSegment[]): Promise<boolean> => {
      await unlockAudio()
      return speak(segments)
    },
    [speak, unlockAudio],
  )

  const supertonicReady = voicesReady
  const supertonicLoading = isSupported && !voicesReady
  const supertonicFailed = false

  useEffect(() => {
    if (!BROWSER_SPEECH_ON) return
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
