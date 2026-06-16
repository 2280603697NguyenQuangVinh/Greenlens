import { useEffect, useRef } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { CharacterSpeechBubble } from "@/features/dashboard/components/CharacterSpeechBubble"
import type { SpeechSegment } from "@/utils/browserSpeech"
import type { AvatarConfig } from "@/utils/types"

type Props = {
  speechText: string
  speechSegments: SpeechSegment[]
  avatarCfg: AvatarConfig
  isSupported: boolean
  isSpeaking: boolean
  onSpeak: (segments: SpeechSegment[]) => void
  onStop: () => void
  autoSpeak?: boolean
}

export function MascotGuidance({
  speechText,
  speechSegments,
  avatarCfg,
  isSupported,
  isSpeaking,
  onSpeak,
  onStop,
  autoSpeak = true,
}: Props) {
  const spokenRef = useRef<string | null>(null)
  const onSpeakRef = useRef(onSpeak)
  onSpeakRef.current = onSpeak

  useEffect(() => {
    if (!autoSpeak || !isSupported || !speechText || speechSegments.length === 0) return
    if (spokenRef.current === speechText) return
    spokenRef.current = speechText
    onSpeakRef.current(speechSegments)
  }, [autoSpeak, isSupported, speechSegments, speechText])

  return (
    <div className="mb-4">
      <div className="flex items-end gap-3">
        <Mascot cfg={avatarCfg} size={72} />
        <CharacterSpeechBubble>
          <p>{speechText}</p>
          {!isSupported && (
            <p className="mt-2 text-sm text-amber-700">
              Trình duyệt không hỗ trợ đọc giọng nói — hãy đọc hướng dẫn cùng bố mẹ nhé!
            </p>
          )}
        </CharacterSpeechBubble>
      </div>

      {isSupported && (
        <button
          type="button"
          onClick={() => (isSpeaking ? onStop() : onSpeak(speechSegments))}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-2.5 text-sm font-black text-white shadow-md active:scale-[0.98]"
        >
          {isSpeaking ? (
            <>
              <VolumeX size={18} /> Dừng đọc
            </>
          ) : (
            <>
              <Volume2 size={18} /> Nghe lại hướng dẫn
            </>
          )}
        </button>
      )}
    </div>
  )
}
