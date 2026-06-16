import { useCallback, useEffect, useRef, useState } from "react"
import {
  cancelBrowserSpeech,
  isBrowserSpeechSupported,
  pickEnglishVoice,
  pickVietnameseVoice,
  speakBilingual,
  type SpeechSegment,
} from "@/utils/browserSpeech"

export function useSpeechSynthesis() {
  const [isSupported] = useState(isBrowserSpeechSupported)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakingRef = useRef(false)

  const cancel = useCallback(() => {
    cancelBrowserSpeech()
    speakingRef.current = false
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((segments: SpeechSegment[]) => {
    if (!isSupported || segments.length === 0) return

    void speakBilingual(segments, {
      onStart: () => {
        speakingRef.current = true
        setIsSpeaking(true)
      },
      onEnd: () => {
        speakingRef.current = false
        setIsSpeaking(false)
      },
      onError: () => {
        speakingRef.current = false
        setIsSpeaking(false)
      },
    })
  }, [isSupported])

  useEffect(() => {
    if (!isSupported) return
    const loadVoices = () => {
      pickVietnameseVoice()
      pickEnglishVoice()
    }
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    loadVoices()
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
      cancel()
    }
  }, [cancel, isSupported])

  return { isSupported, isSpeaking, speak, cancel }
}
