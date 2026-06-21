const VI_VOICES = ["vi-VN", "vi"]
const EN_VOICES = ["en-US", "en-GB", "en"]
const PREFERRED_VI_VOICE_HINTS = [
  "microsoft an",
  "an - vietnamese",
  "linh",
  "hoai my",
  "female",
  "nữ",
  "google vietnamese",
  "google",
]
const SEGMENT_PAUSE_MS = 350

export type SpeechSegment = { lang: "vi" | "en"; text: string }

let speechRunId = 0

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

function vietnameseVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return []
  return window.speechSynthesis
    .getVoices()
    .filter(
      (v) =>
        v.lang.startsWith("vi") ||
        VI_VOICES.some((lang) => v.lang.startsWith(lang)),
    )
}

export function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  const viVoices = vietnameseVoices()
  if (viVoices.length === 0) return null

  for (const hint of PREFERRED_VI_VOICE_HINTS) {
    const match = viVoices.find((v) => v.name.toLowerCase().includes(hint))
    if (match) return match
  }

  const local = viVoices.find((v) => v.localService)
  if (local) return local

  return viVoices[0] ?? null
}

export function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isBrowserSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => EN_VOICES.some((lang) => v.lang.startsWith(lang))) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  )
}

export function cancelBrowserSpeech(): void {
  if (!isBrowserSpeechSupported()) return
  speechRunId++
  window.speechSynthesis.cancel()
}

function speechLangForText(text: string): "vi" | "en" {
  const trimmed = text.trim()
  if (!trimmed) return "vi"
  if (
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      trimmed,
    )
  ) {
    return "vi"
  }
  if (/^[a-z0-9\s.'",!?()-]+$/i.test(trimmed)) return "en"
  return "vi"
}

export function segmentsToDisplayText(segments: SpeechSegment[]): string {
  return segments
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function delayMs(ms: number, runId: number): Promise<void> {
  return new Promise((resolve) => {
    if (runId !== speechRunId) {
      resolve()
      return
    }
    window.setTimeout(() => resolve(), ms)
  })
}

function speakOneSegment(
  segment: SpeechSegment,
  runId: number,
  onStart?: () => void,
): Promise<void> {
  return new Promise((resolve) => {
    if (!isBrowserSpeechSupported() || runId !== speechRunId) {
      resolve()
      return
    }

    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.lang = segment.lang === "vi" ? "vi-VN" : "en-US"
    utterance.rate = segment.lang === "vi" ? 0.86 : 0.9
    utterance.pitch = 1
    utterance.volume = 1

    const voice =
      segment.lang === "vi" ? pickVietnameseVoice() : pickEnglishVoice()
    if (voice) utterance.voice = voice

    let started = false
    utterance.onstart = () => {
      if (!started) {
        started = true
        onStart?.()
      }
    }
    utterance.onend = () => {
      if (runId === speechRunId) resolve()
    }
    utterance.onerror = () => {
      if (runId === speechRunId) resolve()
    }

    window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  })
}

export function speakBrowser(
  text: string,
  handlers?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  },
): void {
  if (!isBrowserSpeechSupported() || !text.trim()) return
  const lang = speechLangForText(text)
  void speakBilingual([{ lang, text: text.trim() }], handlers)
}

export async function speakBilingual(
  segments: SpeechSegment[],
  handlers?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  },
): Promise<void> {
  if (!isBrowserSpeechSupported()) return

  cancelBrowserSpeech()
  const runId = speechRunId

  const queue = segments.filter((s) => s.text.trim())
  if (queue.length === 0) return

  let started = false
  try {
    for (let i = 0; i < queue.length; i++) {
      if (runId !== speechRunId) return
      await speakOneSegment(queue[i], runId, () => {
        if (!started) {
          started = true
          handlers?.onStart?.()
        }
      })
      if (runId !== speechRunId) return
      if (i < queue.length - 1) {
        await delayMs(SEGMENT_PAUSE_MS, runId)
      }
    }
    if (runId === speechRunId) handlers?.onEnd?.()
  } catch {
    handlers?.onError?.()
  }
}

export function mapWasteCategoryKey(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes("non") || lower.includes("không")) return "general"
  if (lower.includes("hữu") || lower.includes("organic")) return "organic"
  if (lower.includes("nguy") || lower.includes("hazard")) return "hazard"
  if (lower.includes("recycl")) return "recycle"
  return "general"
}

export { speechLangForText }
