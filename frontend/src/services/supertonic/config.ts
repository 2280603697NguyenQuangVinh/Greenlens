const HF_BASE =

  "https://huggingface.co/Supertone/supertonic-3/resolve/main"



/** Small config files bundled in public/supertonic (no network / no proxy 401). */

const LOCAL_BASE = "/supertonic"



/** JSON configs: tts.json, unicode_indexer.json */

export function getSupertonicConfigBase(): string {

  const configured = import.meta.env.VITE_SUPERTONIC_ASSETS_BASE?.trim()

  if (configured) return `${configured.replace(/\/$/, "")}/onnx`

  return `${LOCAL_BASE}/onnx`

}



/** Large ONNX weights — fetched directly from HuggingFace (not via Vite proxy). */

export function getSupertonicOnnxDir(): string {

  const configured = import.meta.env.VITE_SUPERTONIC_ASSETS_BASE?.trim()

  if (configured) return `${configured.replace(/\/$/, "")}/onnx`

  return `${HF_BASE}/onnx`

}



export function getSupertonicVoiceStylePath(voiceId?: string): string {

  const voice = voiceId?.trim() || import.meta.env.VITE_SUPERTONIC_VOICE || "F2"

  const configured = import.meta.env.VITE_SUPERTONIC_ASSETS_BASE?.trim()

  if (configured) {

    return `${configured.replace(/\/$/, "")}/voice_styles/${voice}.json`

  }

  return `${LOCAL_BASE}/voice_styles/${voice}.json`

}



export function isSupertonicEnabled(): boolean {

  return (

    import.meta.env.VITE_USE_SUPERTONIC_TTS === "true" &&

    import.meta.env.VITE_USE_MOCK !== "true"

  )

}



export const SUPERTONIC_HF_ORIGIN = HF_BASE

